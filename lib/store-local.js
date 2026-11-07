// Browser-local (demo) store. Same API as store-cloud, so lib/db.js can swap either one.
import { isPoint, jobPoint, providerPoint } from "./geo";
import { roadRoute } from "./route";
import { averagesByProvider, matchOffers } from "./providers";

const KEY = "vahanova_db_v2";

const nowISO = () => new Date().toISOString();
const shortId = (p) => `${p}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const pointOf = (p) => (isPoint(p) ? [Number(p[0]), Number(p[1])] : null);

function blank() {
  return { users: [], vehicles: [], bookings: [], records: [], providers: [], ratings: [], session: null, seq: 1000 };
}

function read() {
  if (typeof window === "undefined") return blank();
  let db;
  try {
    const raw = window.localStorage.getItem(KEY);
    db = raw ? { ...blank(), ...JSON.parse(raw) } : blank();
  } catch {
    return blank();
  }
  write(db);
  return db;
}

function write(db) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(db));
}

export async function currentUser() {
  const db = read();
  return db.users.find((u) => u.id === db.session) || null;
}

export async function login({ name, email, phone, role }) {
  const db = read();
  const key = (email || "").trim().toLowerCase();
  let user = db.users.find((u) => (u.email || "").toLowerCase() === key);
  if (!user) {
    user = { id: shortId("u"), name: name || "", email: key, phone: phone || "", role, area: "", createdAt: nowISO() };
    db.users.push(user);
  } else {
    user.name = name || user.name;
    if (phone) user.phone = phone;
  }
  db.session = user.id;
  write(db);
  return user;
}

export async function logout() {
  const db = read();
  db.session = null;
  write(db);
}

export async function updateProfile({ name, phone }) {
  const db = read();
  const u = db.users.find((x) => x.id === db.session);
  if (!u) return null;
  if (name !== undefined) u.name = (name || "").trim();
  if (phone !== undefined) u.phone = (phone || "").trim();
  write(db);
  return u;
}

export async function mechanics() {
  const db = read();
  return db.users
    .filter((u) => u.role === "mechanic")
    .map((u) => ({ ...u, jobs: db.records.filter((r) => r.mechanicId === u.id).length }));
}

export async function providerProfile(ownerId) {
  const db = read();
  const id = ownerId || db.session;
  if (!id) return null;
  const p = db.providers.find((x) => x.ownerId === id);
  if (!p) return null;
  return { ...p, jobs: db.records.filter((r) => r.mechanicId === id).length, rating: ratingOf(db, id) };
}

function ratingOf(db, providerId) {
  const list = averagesByProvider(db.ratings.filter((r) => r.providerId === providerId));
  return list[0] ? list[0][1] : { avg: 0, count: 0 };
}

export async function saveProviderProfile(input) {
  const db = read();
  const u = db.users.find((x) => x.id === db.session);
  if (!u) return null;
  const profile = {
    ownerId: u.id,
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
  const idx = db.providers.findIndex((x) => x.ownerId === u.id);
  if (idx >= 0) db.providers[idx] = profile;
  else db.providers.push(profile);
  const user = db.users.find((x) => x.id === u.id);
  user.area = profile.area;
  user.name = profile.name;
  user.coord = profile.coord;
  user.upi = profile.upi;
  write(db);
  return profile;
}

export async function providerOffers(opts = {}) {
  const db = read();
  return matchOffers(
    db.providers.map((p) => ({
      ...p,
      jobs: db.records.filter((r) => r.mechanicId === p.ownerId).length,
      rating: ratingOf(db, p.ownerId),
    })),
    opts
  );
}

// One rating per completed job, keyed by the booking — same rule as the Firestore store.
export async function rateBooking({ bookingId, stars, comment }) {
  const db = read();
  const u = db.users.find((x) => x.id === db.session);
  const b = db.bookings.find((x) => x.id === bookingId);
  if (!u || !b || b.customerId !== u.id || b.status !== "completed") return null;
  const rating = {
    id: bookingId,
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
  const idx = db.ratings.findIndex((r) => r.id === bookingId);
  if (idx >= 0) db.ratings[idx] = rating;
  else db.ratings.push(rating);
  write(db);
  return rating;
}

export async function ratingsForCustomer(customerId) {
  return read().ratings.filter((r) => r.customerId === customerId);
}

export async function ratingsForProvider(providerId) {
  return read().ratings.filter((r) => r.providerId === providerId);
}

export async function userById(id) {
  return read().users.find((u) => u.id === id) || null;
}

export async function myVehicles() {
  const u = await currentUser();
  return u ? read().vehicles.filter((v) => v.ownerId === u.id) : [];
}

export async function vehicleById(id) {
  return read().vehicles.find((v) => v.id === id) || null;
}

export async function addVehicle({ number, brand, model, year, type }) {
  const db = read();
  const u = db.users.find((x) => x.id === db.session);
  if (!u) return null;
  const vehicle = {
    id: shortId("v"),
    ownerId: u.id,
    number: number.toUpperCase().replace(/\s/g, ""),
    brand,
    model,
    year,
    type: type || "",
    createdAt: nowISO(),
  };
  db.vehicles.push(vehicle);
  write(db);
  return vehicle;
}

export async function createBooking(input) {
  const db = read();
  const u = db.users.find((x) => x.id === db.session);
  if (!u) return null;
  const booking = {
    id: shortId("b"),
    code: `VP${++db.seq}`,
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
  db.bookings.unshift(booking);
  write(db);
  return booking;
}

export async function updateBooking(id, patch, historyStep) {
  const db = read();
  const b = db.bookings.find((x) => x.id === id);
  if (!b) return null;
  Object.assign(b, patch);
  if (historyStep) b.history = [...(b.history || []), { s: historyStep, t: nowISO() }];
  write(db);
  return b;
}

async function roadEta(m, b) {
  const route = await roadRoute(providerPoint(m), jobPoint(b).point);
  return route ? route.min : null;
}

export async function acceptBooking(id, mechanicId) {
  const b = await bookingById(id);
  if (!b || b.status !== "pending" || b.mechanicId) return null;
  const m = read().users.find((u) => u.id === mechanicId);
  if (!m || m.role !== "mechanic") return null;
  const eta = await roadEta(m, b);
  // Re-check after the asynchronous route lookup so a stale tab cannot accept
  // a request that another local session has already claimed.
  const latest = await bookingById(id);
  if (!latest || latest.status !== "pending" || latest.mechanicId) return null;
  return updateBooking(id, { status: "assigned", mechanicId, etaMin: eta, ...contactOf(m) }, "assigned");
}

export async function assignBooking(id, mechanicId) {
  const db = read();
  const m = db.users.find((u) => u.id === mechanicId);
  const b = db.bookings.find((x) => x.id === id);
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
  return read().bookings.find((b) => b.id === id) || null;
}

export async function bookingByCode(code) {
  return read().bookings.find((b) => b.code === code) || null;
}

export async function bookingsForCustomer(id) {
  return read().bookings.filter((b) => b.customerId === id);
}

export async function bookingsForMechanic(id) {
  return read().bookings.filter((b) => b.mechanicId === id);
}

const publicRequestOf = (b) => ({
  id: b.id,
  bookingId: b.id,
  code: b.code,
  service: b.service || b.problem || "Emergency assistance",
  vehicleNumber: b.vehicleNumber || "",
  kind: b.kind || "",
  date: b.date,
  slot: b.slot || "",
  createdAt: b.createdAt,
  status: "pending",
  isOpenRequest: true,
});

export async function openRequestsForMechanic(id) {
  return read().bookings
    .filter((b) => b.mechanicId === id || (!b.mechanicId && b.status === "pending"))
    .map((b) => b.mechanicId === id ? b : publicRequestOf(b));
}

export async function subscribeOpenRequestsForMechanic(id, onNext, onError = () => {}) {
  const publish = () => {
    try {
      onNext(read().bookings
        .filter((b) => b.mechanicId === id || (!b.mechanicId && b.status === "pending"))
        .map((b) => b.mechanicId === id ? b : publicRequestOf(b)));
    } catch (error) {
      onError(error);
    }
  };
  publish();
  // Demo mode uses browser storage; poll locally so updates in another tab appear too.
  const timer = setInterval(publish, 2000);
  return () => clearInterval(timer);
}

export async function allBookings() {
  return read().bookings;
}

export async function completeBooking(id, { parts, labour, warrantyDays, note, paymentMode }) {
  const db = read();
  const b = db.bookings.find((x) => x.id === id);
  if (!b) return null;
  const existingRecord = db.records.find((r) => r.bookingId === id);
  if (existingRecord && b.status === "completed") {
    return { booking: b, total: existingRecord.total, recordId: existingRecord.id };
  }
  if (b.status !== "in_progress" || b.mechanicId !== db.session) return null;
  const partsCost = (parts || []).reduce((s, p) => s + (Number(p.qty) || 0) * (Number(p.price) || 0), 0);
  const total = (Number(labour) || 0) + partsCost;
  // Whose claim is this? The provider's. VAHANOVA never sees money move.
  const paid = paymentMode === "cash" || paymentMode === "upi";
  b.status = "completed";
  b.amount = total;
  b.history = [...(b.history || []), { s: "completed", t: nowISO() }];
  const mechanic = db.users.find((u) => u.id === b.mechanicId);
  db.records.unshift({
    id: b.id,
    bookingId: b.id,
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
  });
  write(db);
  return { booking: b, total, recordId: b.id };
}

export async function recordsForVehicle(vehicleId) {
  return read().records.filter((r) => r.vehicleId === vehicleId);
}

export async function recordsForCustomer(customerId) {
  const db = read();
  const ownedVehicleIds = new Set(db.vehicles.filter((v) => v.ownerId === customerId).map((v) => v.id));
  return db.records.filter((r) => r.customerId === customerId || (!r.customerId && ownedVehicleIds.has(r.vehicleId)));
}

export async function stats() {
  const db = read();
  return {
    bookings: db.bookings.length,
    open: db.bookings.filter((b) => !["completed", "cancelled"].includes(b.status)).length,
    mechanics: db.users.filter((u) => u.role === "mechanic").length,
    customers: db.users.filter((u) => u.role === "customer").length,
    billed: db.records.reduce((s, r) => s + (r.total || 0), 0),
    commission: 0,
  };
}
