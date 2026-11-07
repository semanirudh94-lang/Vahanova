import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
} from "firebase/firestore";
import { firestore, signedInUser } from "./firebase";
import { signOutAuth } from "./auth";
import { isPoint, jobPoint, providerPoint } from "./geo";
import { roadRoute } from "./route";
import { averagesByProvider, matchOffers } from "./providers";

const nowISO = () => new Date().toISOString();
const shortId = (p) => `${p}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
// Coordinates are stored as plain [lat, lng] numbers, or null when nobody shared a pin.
const pointOf = (p) => (isPoint(p) ? [Number(p[0]), Number(p[1])] : null);

const col = (fs, name) => collection(fs, name);
const ref = (fs, name, id) => doc(fs, name, id);

async function list(fs, name) {
  const snap = await getDocs(col(fs, name));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function find(fs, name, field, value) {
  const snap = await getDocs(query(col(fs, name), where(field, "==", value)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function currentUser() {
  const fu = await signedInUser();
  if (!fu) return null;
  const snap = await getDoc(ref(await firestore(), "users", fu.uid));
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  // Authenticated in Firebase but the profile doc never landed (a sign-in that
  // finished in another window) — treat it as an account that still needs a name.
  return {
    id: fu.uid,
    name: fu.displayName || "",
    email: (fu.email || "").toLowerCase(),
    phone: "",
    role: "customer",
    area: "",
    jobs: 0,
    createdAt: nowISO(),
  };
}

export async function login({ name, email, phone, role }) {
  const fs = await firestore();
  const fu = await signedInUser();
  if (!fu) throw new Error("Please sign in with Google or your email and password first.");
  const id = fu.uid;
  const existing = (await getDoc(ref(fs, "users", id))).data() || {};
  const user = {
    id,
    name: name || existing.name || fu.displayName || "",
    email: (fu.email || email || existing.email || "").toLowerCase(),
    phone: phone || existing.phone || "",
    // The tab a person clicked on the sign-in screen is not a role change. A role is
    // set when the account is created; otherwise one email flip-flops between the
    // customer dashboard and the provider desk and both look broken.
    role: existing.role || role,
    area: existing.area || "",
    jobs: existing.jobs || 0,
    createdAt: existing.createdAt || nowISO(),
  };
  await setDoc(ref(fs, "users", id), user, { merge: true });
  return user;
}

export async function logout() {
  await signOutAuth();
}

export async function updateProfile({ name, phone }) {
  const fu = await signedInUser();
  if (!fu) return null;
  const fs = await firestore();
  await setDoc(ref(fs, "users", fu.uid), { name: (name || "").trim(), phone: (phone || "").trim() }, { merge: true });
  const snap = await getDoc(ref(fs, "users", fu.uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function mechanics() {
  const fs = await firestore();
  return (await find(fs, "users", "role", "mechanic")).sort((a, b) => (b.jobs || 0) - (a.jobs || 0));
}

export async function providerProfile(ownerId) {
  const fs = await firestore();
  const id = ownerId || (await signedInUser())?.uid;
  if (!id) return null;
  const snap = await getDoc(ref(fs, "providers", id));
  if (!snap.exists()) return null;
  return { ownerId: snap.id, ...snap.data() };
}

export async function saveProviderProfile(input) {
  const u = await currentUser();
  if (!u) return null;
  const fs = await firestore();
  const profile = {
    name: input.name || u.name,
    phone: input.phone || u.phone,
    area: input.area || "",
    coord: pointOf(input.coord),
    upi: (input.upi || "").trim(),
    vehicleTypes: input.vehicleTypes || [],
    services: (input.services || []).filter((s) => s.key && Number(s.price) > 0).map((s) => ({ key: s.key, price: Number(s.price), mode: s.mode })),
    active: input.active !== false,
    updatedAt: nowISO(),
  };
  await setDoc(ref(fs, "providers", u.id), profile, { merge: true });
  await setDoc(
    ref(fs, "users", u.id),
    { area: profile.area, name: profile.name, coord: profile.coord, upi: profile.upi },
    { merge: true }
  );
  return { ownerId: u.id, ...profile };
}

export async function providerOffers(opts = {}) {
  const fs = await firestore();
  const ratings = Object.fromEntries(averagesByProvider(await list(fs, "ratings")));
  const profiles = (await list(fs, "providers")).map((p) => ({
    ...p,
    ownerId: p.id,
    jobs: p.jobs || 0,
    rating: ratings[p.id] || { avg: 0, count: 0 },
  }));
  return matchOffers(profiles, opts);
}

// One rating per completed job: the document id is the booking id, so a second
// submission for the same job replaces nothing silently — it is rejected by rules.
export async function rateBooking({ bookingId, stars, comment }) {
  const u = await currentUser();
  if (!u) return null;
  const fs = await firestore();
  const b = await bookingById(bookingId);
  if (!b || b.customerId !== u.id || b.status !== "completed") return null;
  const rating = {
    bookingId,
    bookingCode: b.code,
    providerId: b.mechanicId || null,
    providerName: b.mechanicName || "Service partner",
    customerId: u.id,
    customerName: u.name || "",
    vehicleId: b.vehicleId || null,
    vehicleNumber: b.vehicleNumber || "",
    service: b.service || b.problem || "Service",
    stars: Math.min(5, Math.max(1, Number(stars) || 0)),
    comment: (comment || "").trim().slice(0, 200),
    createdAt: nowISO(),
  };
  await setDoc(ref(fs, "ratings", bookingId), rating);
  return rating;
}

export async function ratingsForCustomer(customerId) {
  return find(await firestore(), "ratings", "customerId", customerId);
}

export async function ratingsForProvider(providerId) {
  return find(await firestore(), "ratings", "providerId", providerId);
}

export async function userById(id) {
  if (!id) return null;
  const snap = await getDoc(ref(await firestore(), "users", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function myVehicles() {
  const u = await currentUser();
  return u ? await find(await firestore(), "vehicles", "ownerId", u.id) : [];
}

export async function vehicleById(id) {
  if (!id) return null;
  const snap = await getDoc(ref(await firestore(), "vehicles", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function addVehicle({ number, brand, model, year, type }) {
  const u = await currentUser();
  if (!u) return null;
  const fs = await firestore();
  const v = {
    ownerId: u.id,
    number: number.toUpperCase().replace(/\s/g, ""),
    brand,
    model,
    year,
    type: type || "",
    createdAt: nowISO(),
  };
  const added = await addDoc(col(fs, "vehicles"), v);
  return { id: added.id, ...v };
}

async function nextCode(fs) {
  const counter = ref(fs, "meta", "seq");
  return runTransaction(fs, async (tx) => {
    const snap = await tx.get(counter);
    const n = (snap.exists() ? snap.data().n : 1000) + 1;
    tx.set(counter, { n }, { merge: true });
    return `VP${n}`;
  });
}

export async function createBooking(input) {
  const u = await currentUser();
  if (!u) return null;
  const fs = await firestore();
  const code = await nextCode(fs);
  const b = {
    code,
    customerId: u.id,
    customerName: u.name,
    customerPhone: input.customerPhone || u.phone || "",
    vehicleId: input.vehicleId || null,
    vehicleNumber: input.vehicleNumber || "",
    vehicleType: input.vehicleType || "",
    kind: input.kind,
    service: input.service || "",
    serviceKey: input.serviceKey || "",
    problem: input.problem || "",
    address: input.address || "",
    // null means the customer shared no GPS fix — screens must say that, not guess a street.
    coord: pointOf(input.coord),
    locAccuracy: input.accuracy ?? null,
    date: input.date || nowISO().slice(0, 10),
    slot: input.slot || "",
    amount: input.amount || 0,
    status: input.mechanicId ? "assigned" : "pending",
    mechanicId: input.mechanicId || null,
    etaMin: input.etaMin ?? null,
    createdAt: nowISO(),
    history: [{ s: "placed", t: nowISO() }],
  };
  const added = await addDoc(col(fs, "bookings"), b);
  return { id: added.id, ...b };
}

export async function updateBooking(id, patch, historyStep) {
  const fs = await firestore();
  const r = ref(fs, "bookings", id);
  const snap = await getDoc(r);
  if (!snap.exists()) return null;
  const prev = { id: snap.id, ...snap.data() };
  const next = { ...prev, ...patch };
  if (historyStep) next.history = [...(prev.history || []), { s: historyStep, t: nowISO() }];
  await setDoc(r, next, { merge: true });
  return next;
}

async function roadEta(m, b) {
  const route = await roadRoute(providerPoint(m), jobPoint(b).point);
  return route ? route.min : null;
}

export async function acceptBooking(id, mechanicId) {
  const b = await bookingById(id);
  if (!b) return null;
  const m = await userById(mechanicId);
  const eta = m ? await roadEta(m, b) : null;
  return updateBooking(id, { status: "assigned", mechanicId, etaMin: eta, ...contactOf(m) }, "assigned");
}

export async function assignBooking(id, mechanicId) {
  const [m, b] = await Promise.all([userById(mechanicId), bookingById(id)]);
  const eta = m && b ? await roadEta(m, b) : null;
  return updateBooking(id, { status: "assigned", mechanicId, etaMin: eta, ...contactOf(m) }, "assigned");
}

// The provider's own details travel with the job, so the customer's screens never
// have to read another person's account document.
function contactOf(m) {
  return {
    mechanicName: m?.name || "",
    mechanicPhone: m?.phone || "",
    mechanicArea: m?.area || "",
    mechanicJobs: m?.jobs || 0,
    mechanicUpi: m?.upi || "",
    mechanicCoord: pointOf(m?.coord),
  };
}

export async function bookingById(id) {
  if (!id) return null;
  const snap = await getDoc(ref(await firestore(), "bookings", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function bookingByCode(code) {
  const hits = await find(await firestore(), "bookings", "code", code);
  return hits[0] || null;
}

const byNewest = (a, b) => (b.createdAt || "").localeCompare(a.createdAt || "");

export async function bookingsForCustomer(id) {
  return (await find(await firestore(), "bookings", "customerId", id)).sort(byNewest);
}

export async function bookingsForMechanic(id) {
  return (await find(await firestore(), "bookings", "mechanicId", id)).sort(byNewest);
}

export async function openRequestsForMechanic(id) {
  const fs = await firestore();
  const mine = await find(fs, "bookings", "mechanicId", id);
  const pool = await find(fs, "bookings", "status", "pending");
  const unassigned = pool.filter((b) => !b.mechanicId);
  const seen = new Set();
  return [...mine, ...unassigned].filter((b) => (seen.has(b.id) ? false : seen.add(b.id)));
}

export async function allBookings() {
  const fs = await firestore();
  const snap = await getDocs(query(col(fs, "bookings"), orderBy("createdAt", "desc"), limit(200)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function completeBooking(id, { parts, labour, warrantyDays, note, paymentMode }) {
  const fs = await firestore();
  const b = await bookingById(id);
  if (!b) return null;
  const partsCost = (parts || []).reduce((s, p) => s + (Number(p.qty) || 0) * (Number(p.price) || 0), 0);
  const total = (Number(labour) || 0) + partsCost;
  // Whose claim is this? The provider's. VAHANOVA never sees money move.
  const paid = paymentMode === "cash" || paymentMode === "upi";
  await updateBooking(id, { status: "completed", amount: total }, "completed");
  const mechanic = await userById(b.mechanicId);
  const record = {
    customerId: b.customerId,
    vehicleId: b.vehicleId,
    vehicleNumber: b.vehicleNumber,
    bookingCode: b.code,
    date: nowISO().slice(0, 10),
    service: b.service || b.problem || "Service",
    mechanicId: b.mechanicId,
    mechanicName: mechanic ? mechanic.name : "Service partner",
    mechanicPhone: b.mechanicPhone || mechanic?.phone || "",
    mechanicUpi: b.mechanicUpi || mechanic?.upi || "",
    parts: parts || [],
    labour: Number(labour) || 0,
    total,
    warrantyDays: Number(warrantyDays) || 0,
    note: note || "",
    paymentMode: paymentMode || "unpaid",
    paidAt: paid ? nowISO() : null,
    createdAt: nowISO(),
  };
  const added = await addDoc(col(fs, "records"), record);
  if (b.mechanicId) {
    await setDoc(ref(fs, "users", b.mechanicId), { jobs: increment(1) }, { merge: true });
    await setDoc(ref(fs, "providers", b.mechanicId), { jobs: increment(1) }, { merge: true });
  }
  return { booking: { ...b, status: "completed", amount: total }, total, recordId: added.id };
}

export async function recordsForVehicle(vehicleId) {
  const fs = await firestore();
  const v = await getDoc(ref(fs, "vehicles", vehicleId));
  const ownerId = v.exists() ? v.data().ownerId : null;
  if (!ownerId) return [];
  // Filter on customerId (a field on the record itself) so the list rule is
  // provable; a vehicleId-only query relies on a cross-document get() that
  // Firestore cannot verify for list queries and would deny.
  const snap = await getDocs(
    query(col(fs, "records"), where("customerId", "==", ownerId), where("vehicleId", "==", vehicleId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export async function recordsForCustomer(customerId) {
  const hits = await find(await firestore(), "records", "customerId", customerId);
  return hits.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export async function stats() {
  const fs = await firestore();
  const [bookings, users, records] = await Promise.all([list(fs, "bookings"), list(fs, "users"), list(fs, "records")]);
  return {
    bookings: bookings.length,
    open: bookings.filter((b) => !["completed", "cancelled"].includes(b.status)).length,
    mechanics: users.filter((u) => u.role === "mechanic").length,
    customers: users.filter((u) => u.role === "customer").length,
    billed: records.reduce((s, r) => s + (r.total || 0), 0),
    commission: 0,
  };
}
