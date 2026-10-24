// Browser-local (demo) store. Same API as store-cloud, so lib/db.js can swap either one.
import { addressCoord, etaMinutes } from "./geo";

const KEY = "vahanproof_db_v1";

const nowISO = () => new Date().toISOString();
const shortId = (p) => `${p}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const seedMechanics = () => [
  { id: "m1", name: "Rohit Kumar", phone: "+919876500001", role: "mechanic", area: "Rajpur Road", coord: [30.305, 78.032], rating: 4.8, jobs: 120 },
  { id: "m2", name: "Anil Singh", phone: "+919876500002", role: "mechanic", area: "Ballupur", coord: [30.3154, 78.0314], rating: 4.6, jobs: 84 },
  { id: "m3", name: "Feroz Khan", phone: "+919876500003", role: "mechanic", area: "Prem Nagar", coord: [30.323, 78.0205], rating: 4.7, jobs: 65 },
];

function blank() {
  return { users: seedMechanics(), vehicles: [], bookings: [], records: [], session: null, seq: 1000 };
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
  if (!db.users.some((u) => u.id === "m1")) db.users = [...seedMechanics(), ...db.users];
  seedMechanics().forEach((m) => {
    const u = db.users.find((x) => x.id === m.id);
    if (u && !u.coord) u.coord = m.coord;
  });
  write(db);
  return db;
}

function write(db) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(db));
}

export async function resetAll() {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}

export async function currentUser() {
  const db = read();
  return db.users.find((u) => u.id === db.session) || null;
}

export async function login({ name, phone, role }) {
  const db = read();
  let user = db.users.find((u) => u.phone === phone && u.role === role);
  if (!user) {
    user = { id: shortId("u"), name: name || "Guest", phone, role, area: "", rating: null, jobs: 0, createdAt: nowISO() };
    db.users.push(user);
  } else if (name) {
    user.name = name;
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

export async function mechanics() {
  return read().users.filter((u) => u.role === "mechanic");
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

export async function addVehicle({ number, brand, model, year }) {
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
    createdAt: nowISO(),
  };
  db.vehicles.push(vehicle);
  write(db);
  return vehicle;
}

function pickMechanic(db) {
  const ms = db.users.filter((u) => u.role === "mechanic");
  if (!ms.length) return null;
  const load = (id) => db.bookings.filter((b) => b.mechanicId === id && !["completed", "cancelled"].includes(b.status)).length;
  return ms.sort((a, b) => load(a.id) - load(b.id))[0];
}

export async function createBooking(input) {
  const db = read();
  const u = db.users.find((x) => x.id === db.session);
  if (!u) return null;
  const mechanic = input.kind === "emergency" ? pickMechanic(db) : null;
  const booking = {
    id: shortId("b"),
    code: `VP${++db.seq}`,
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
    status: mechanic ? "assigned" : "pending",
    mechanicId: mechanic ? mechanic.id : null,
    etaMin: mechanic ? etaMinutes(mechanic.coord || [30.3163, 78.0333], addressCoord(input.address)) : null,
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

export async function acceptBooking(id, mechanicId) {
  const b = await bookingById(id);
  const m = b ? read().users.find((u) => u.id === mechanicId) : null;
  const eta = m ? etaMinutes(m.coord || [30.3163, 78.0333], addressCoord(b.address)) : 18;
  return updateBooking(id, { status: "assigned", mechanicId, etaMin: eta }, "assigned");
}

export async function assignBooking(id, mechanicId) {
  return updateBooking(id, { status: "assigned", mechanicId }, "assigned");
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

export async function openRequestsForMechanic(id) {
  return read().bookings.filter(
    (b) => b.mechanicId === id || (!b.mechanicId && b.status === "pending")
  );
}

export async function allBookings() {
  return read().bookings;
}

export async function completeBooking(id, { parts, labour, warrantyDays, note }) {
  const db = read();
  const b = db.bookings.find((x) => x.id === id);
  if (!b) return null;
  const partsCost = (parts || []).reduce((s, p) => s + (Number(p.qty) || 0) * (Number(p.price) || 0), 0);
  const total = (Number(labour) || 0) + partsCost;
  b.status = "completed";
  b.amount = total;
  b.history = [...(b.history || []), { s: "completed", t: nowISO() }];
  const mechanic = db.users.find((u) => u.id === b.mechanicId);
  db.records.unshift({
    id: shortId("r"),
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
  });
  if (mechanic) mechanic.jobs = (mechanic.jobs || 0) + 1;
  write(db);
  return { booking: b, total };
}

export async function recordsForVehicle(vehicleId) {
  return read().records.filter((r) => r.vehicleId === vehicleId);
}

export async function recordsForCustomer(customerId) {
  const db = read();
  const ids = db.vehicles.filter((v) => v.ownerId === customerId).map((v) => v.id);
  return db.records.filter((r) => ids.includes(r.vehicleId));
}

export async function stats() {
  const db = read();
  const revenue = db.records.reduce((s, r) => s + (r.total || 0), 0);
  return {
    bookings: db.bookings.length,
    open: db.bookings.filter((b) => !["completed", "cancelled"].includes(b.status)).length,
    mechanics: db.users.filter((u) => u.role === "mechanic").length,
    customers: db.users.filter((u) => u.role === "customer").length,
    revenue,
  };
}

export async function seedDemoAccount() {
  const db = read();
  let u = db.users.find((x) => x.phone === "+919999900000" && x.role === "customer");
  if (!u) {
    u = { id: "demo_cust", name: "Demo Customer", phone: "+919999900000", role: "customer", createdAt: nowISO() };
    db.users.push(u);
    const v = { id: "demo_v1", ownerId: u.id, number: "UK07AB1234", brand: "Maruti", model: "Swift", year: "2019", createdAt: nowISO() };
    const v2 = { id: "demo_v2", ownerId: u.id, number: "UK03CD5678", brand: "Honda", model: "Activa 6G", year: "2021", createdAt: nowISO() };
    db.vehicles.push(v, v2);
    db.records.unshift(
      { id: "demo_r1", vehicleId: v.id, vehicleNumber: v.number, bookingCode: "VP1001", date: "2026-09-12", service: "General Service", mechanicId: "m1", mechanicName: "Rohit Kumar", parts: [{ name: "Engine Oil 10W30", qty: 1, price: 720 }, { name: "Oil Filter", qty: 1, price: 240 }], labour: 499, total: 1459, warrantyDays: 30, note: "Chain lube done, tyre pressure set" },
      { id: "demo_r2", vehicleId: v2.id, vehicleNumber: v2.number, bookingCode: "VP1002", date: "2026-08-05", service: "Brake Service", mechanicId: "m2", mechanicName: "Anil Singh", parts: [{ name: "Brake Shoe Set", qty: 1, price: 480 }], labour: 349, total: 829, warrantyDays: 30, note: "Front disc cleaned" }
    );
    db.seq = 1100;
  }
  db.session = u.id;
  write(db);
  return u;
}
