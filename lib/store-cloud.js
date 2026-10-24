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
import { firestore } from "./firebase";
import { addressCoord, etaMinutes } from "./geo";

const SESSION_KEY = "vahanproof_session";
const CITY_CENTER = [30.3163, 78.0333];

const nowISO = () => new Date().toISOString();
const shortId = (p) => `${p}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

// Tere asli partner yahan se replace honge — naya mechanic add karne ke liye ye list badalna hai.
export const PARTNER_SEED = [
  { id: "m1", name: "Rohit Kumar", phone: "+919876500001", role: "mechanic", area: "Rajpur Road", coord: [30.305, 78.032], rating: 4.8, jobs: 120 },
  { id: "m2", name: "Anil Singh", phone: "+919876500002", role: "mechanic", area: "Ballupur", coord: [30.3154, 78.0314], rating: 4.6, jobs: 84 },
  { id: "m3", name: "Feroz Khan", phone: "+919876500003", role: "mechanic", area: "Prem Nagar", coord: [30.323, 78.0205], rating: 4.7, jobs: 65 },
];

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

async function ensurePartners(fs) {
  const existing = await getDoc(ref(fs, "users", "m1"));
  if (existing.exists()) return;
  for (const m of PARTNER_SEED) await setDoc(ref(fs, "users", m.id), { ...m, createdAt: nowISO() });
}

function sessionSet(id) {
  if (typeof window !== "undefined") window.localStorage.setItem(SESSION_KEY, id);
}
function sessionGet() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(SESSION_KEY);
}

export function resetAll() {
  if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
}

export async function currentUser() {
  const id = sessionGet();
  if (!id) return null;
  const snap = await getDoc(ref(await firestore(), "users", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function login({ name, phone, role }) {
  const fs = await firestore();
  await ensurePartners(fs);
  const hits = (await find(fs, "users", "phone", phone)).filter((u) => u.role === role);
  let user = hits[0] || null;
  if (!user) {
    const id = shortId("u");
    user = { id, name: name || "Guest", phone, role, area: "", rating: null, jobs: 0, createdAt: nowISO() };
    await setDoc(ref(fs, "users", id), user);
  } else if (name && name !== user.name) {
    await setDoc(ref(fs, "users", user.id), { name }, { merge: true });
    user = { ...user, name };
  }
  sessionSet(user.id);
  return user;
}

export async function logout() {
  resetAll();
}

export async function mechanics() {
  const fs = await firestore();
  await ensurePartners(fs);
  return (await find(fs, "users", "role", "mechanic")).sort((a, b) => (b.rating || 0) - (a.rating || 0));
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

export async function addVehicle({ number, brand, model, year }) {
  const u = await currentUser();
  if (!u) return null;
  const fs = await firestore();
  const v = {
    ownerId: u.id,
    number: number.toUpperCase().replace(/\s/g, ""),
    brand,
    model,
    year,
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

async function pickPartner(fs, address) {
  const ms = await mechanics();
  if (!ms.length) return null;
  const loads = await Promise.all(
    ms.map(async (m) => {
      const mine = (await find(fs, "bookings", "mechanicId", m.id)).filter(
        (b) => !["completed", "cancelled"].includes(b.status)
      );
      return { m, load: mine.length };
    })
  );
  loads.sort((a, b) => a.load - b.load);
  const m = loads[0].m;
  return { ...m, etaMin: etaMinutes(m.coord || CITY_CENTER, addressCoord(address)) };
}

export async function createBooking(input) {
  const u = await currentUser();
  if (!u) return null;
  const fs = await firestore();
  const partner = input.kind === "emergency" ? await pickPartner(fs, input.address) : null;
  const code = await nextCode(fs);
  const b = {
    code,
    customerId: u.id,
    customerName: u.name,
    customerPhone: u.phone,
    vehicleId: input.vehicleId || null,
    vehicleNumber: input.vehicleNumber || "",
    kind: input.kind,
    service: input.service || "",
    problem: input.problem || "",
    address: input.address || "",
    date: input.date || nowISO().slice(0, 10),
    slot: input.slot || "",
    amount: input.amount || 0,
    status: partner ? "assigned" : "pending",
    mechanicId: partner ? partner.id : null,
    etaMin: partner ? partner.etaMin : null,
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

export async function acceptBooking(id, mechanicId) {
  const b = await bookingById(id);
  if (!b) return null;
  const m = await userById(mechanicId);
  const eta = m ? etaMinutes(m.coord || CITY_CENTER, addressCoord(b.address)) : 18;
  return updateBooking(id, { status: "assigned", mechanicId, etaMin: eta }, "assigned");
}

export async function assignBooking(id, mechanicId) {
  const [m, b] = await Promise.all([userById(mechanicId), bookingById(id)]);
  const eta = m && b ? etaMinutes(m.coord || CITY_CENTER, addressCoord(b.address)) : null;
  return updateBooking(id, { status: "assigned", mechanicId, etaMin: eta }, "assigned");
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
  const unassigned = (await list(fs, "bookings")).filter((b) => !b.mechanicId && b.status === "pending");
  const seen = new Set();
  return [...mine, ...unassigned].filter((b) => (seen.has(b.id) ? false : seen.add(b.id)));
}

export async function allBookings() {
  const fs = await firestore();
  const snap = await getDocs(query(col(fs, "bookings"), orderBy("createdAt", "desc"), limit(200)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function completeBooking(id, { parts, labour, warrantyDays, note }) {
  const fs = await firestore();
  const b = await bookingById(id);
  if (!b) return null;
  const partsCost = (parts || []).reduce((s, p) => s + (Number(p.qty) || 0) * (Number(p.price) || 0), 0);
  const total = (Number(labour) || 0) + partsCost;
  await updateBooking(id, { status: "completed", amount: total }, "completed");
  const mechanic = await userById(b.mechanicId);
  const record = {
    vehicleId: b.vehicleId,
    vehicleNumber: b.vehicleNumber,
    bookingCode: b.code,
    date: nowISO().slice(0, 10),
    service: b.service || b.problem || "Service",
    mechanicId: b.mechanicId,
    mechanicName: mechanic ? mechanic.name : "VahanProof partner",
    parts: parts || [],
    labour: Number(labour) || 0,
    total,
    warrantyDays: Number(warrantyDays) || 30,
    note: note || "",
    createdAt: nowISO(),
  };
  const added = await addDoc(col(fs, "records"), record);
  if (b.mechanicId) await setDoc(ref(fs, "users", b.mechanicId), { jobs: increment(1) }, { merge: true });
  return { booking: { ...b, status: "completed", amount: total }, total, recordId: added.id };
}

export async function recordsForVehicle(vehicleId) {
  const hits = await find(await firestore(), "records", "vehicleId", vehicleId);
  return hits.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export async function recordsForCustomer(customerId) {
  const fs = await firestore();
  const ids = (await find(fs, "vehicles", "ownerId", customerId)).map((v) => v.id);
  if (!ids.length) return [];
  const snap = await getDocs(query(col(fs, "records"), where("vehicleId", "in", ids.slice(0, 10))));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export async function stats() {
  const fs = await firestore();
  const [bookings, users, records] = await Promise.all([list(fs, "bookings"), list(fs, "users"), list(fs, "records")]);
  return {
    bookings: bookings.length,
    open: bookings.filter((b) => !["completed", "cancelled"].includes(b.status)).length,
    mechanics: users.filter((u) => u.role === "mechanic").length,
    customers: users.filter((u) => u.role === "customer").length,
    revenue: records.reduce((s, r) => s + (r.total || 0), 0),
  };
}

export async function seedDemoAccount() {
  const fs = await firestore();
  await ensurePartners(fs);
  const hits = (await find(fs, "users", "phone", "+919999900000")).filter((u) => u.role === "customer");
  let u = hits[0];
  if (!u) {
    const id = "demo_cust";
    u = { id, name: "Demo Customer", phone: "+919999900000", role: "customer", createdAt: nowISO() };
    await setDoc(ref(fs, "users", id), u);
    const v1 = { ownerId: id, number: "UK07AB1234", brand: "Maruti", model: "Swift", year: "2019", createdAt: nowISO() };
    const v2 = { ownerId: id, number: "UK03CD5678", brand: "Honda", model: "Activa 6G", year: "2021", createdAt: nowISO() };
    const c1 = await addDoc(col(fs, "vehicles"), v1);
    const c2 = await addDoc(col(fs, "vehicles"), v2);
    await addDoc(col(fs, "records"), {
      vehicleId: c1.id, vehicleNumber: v1.number, bookingCode: "VP1001", date: "2026-09-12",
      service: "General Service", mechanicId: "m1", mechanicName: "Rohit Kumar",
      parts: [{ name: "Engine Oil 10W30", qty: 1, price: 720 }, { name: "Oil Filter", qty: 1, price: 240 }],
      labour: 499, total: 1459, warrantyDays: 30, note: "Chain lube done, tyre pressure set", createdAt: nowISO(),
    });
    await addDoc(col(fs, "records"), {
      vehicleId: c2.id, vehicleNumber: v2.number, bookingCode: "VP1002", date: "2026-08-05",
      service: "Brake Service", mechanicId: "m2", mechanicName: "Anil Singh",
      parts: [{ name: "Brake Shoe Set", qty: 1, price: 480 }],
      labour: 349, total: 829, warrantyDays: 30, note: "Front disc cleaned", createdAt: nowISO(),
    });
  }
  sessionSet(u.id);
  return u;
}
