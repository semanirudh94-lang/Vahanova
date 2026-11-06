"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Car,
  Wrench,
  Siren,
  FileText,
  History,
  User,
  Plus,
  ChevronRight,
  Fuel,
  ShieldCheck,
  CalendarClock,
  Navigation,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import RateJob from "@/components/RateJob";
import { currentUser, myVehicles, addVehicle, bookingsForCustomer, recordsForCustomer, ratingsForCustomer } from "@/lib/db";
import { STATUS_LABEL, STATUS_TINT, VEHICLE_TYPES } from "@/data/services";

const PAY_SHORT = {
  cash: "Cash collected",
  upi: "Paid by UPI",
  unpaid: "Payment pending",
};

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Car, label: "My Vehicles", href: "/dashboard" },
  { icon: Wrench, label: "Book Service", href: "/book" },
  { icon: Siren, label: "Emergency Help", href: "/emergency" },
  { icon: Navigation, label: "Track a Job", href: "/track" },
  { icon: FileText, label: "Documents", href: "/passport" },
  { icon: History, label: "Service History", href: "/passport" },
  { icon: User, label: "Profile", href: "/dashboard" },
];

const QUICK = [
  { icon: Wrench, title: "Book Your Service", desc: "Compare provider rates", href: "/book" },
  { icon: Fuel, title: "Emergency Help", desc: "Fuel · Towing · Battery", href: "/emergency" },
  { icon: FileText, title: "Your Documents", desc: "RC · Insurance · PUC", href: "/passport" },
  { icon: History, title: "Service History", desc: "All past records", href: "/passport" },
];

const inputCls =
  "w-full rounded-lg border border-navy-border bg-navy px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-brand-blue";

export default function Dashboard() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [records, setRecords] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ number: "", brand: "", model: "", year: "", type: VEHICLE_TYPES[0] });

  async function refresh() {
    const u = await currentUser();
    setUser(u);
    setVehicles(u ? await myVehicles() : []);
    setBookings(u ? await bookingsForCustomer(u.id) : []);
    setRecords(u ? await recordsForCustomer(u.id) : []);
    setMyRatings(u ? await ratingsForCustomer(u.id) : []);
  }

  useEffect(() => {
    refresh().then(() => setReady(true));
  }, []);

  async function save() {
    if (!form.number || !form.brand) return;
    await addVehicle(form);
    setForm({ number: "", brand: "", model: "", year: "", type: VEHICLE_TYPES[0] });
    setAdding(false);
    refresh();
  }

  if (!ready) return null;

  const active = bookings.filter((b) => !["completed", "cancelled"].includes(b.status));
  const finished = bookings.filter((b) => b.status === "completed").slice(0, 3);

  return (
    <AppShell items={NAV} active="Dashboard">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-xl border border-navy-border bg-navy-light p-6 lg:col-span-2">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-amber/10 blur-2xl" />
          <p className="text-lg font-semibold">Need Immediate Help?</p>
          <p className="mt-1 text-sm text-gray-400">Emergency fuel, towing, battery and more — one tap.</p>
          <Link
            href="/emergency"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-amber px-5 py-2.5 text-sm font-bold text-navy transition hover:brightness-110"
          >
            <Siren className="h-4 w-4" /> Get Help Now
          </Link>
        </div>

        <div className="rounded-xl border border-navy-border bg-navy-light p-6">
          <div className="flex items-center justify-between">
            <p className="font-semibold">My Vehicles</p>
            <button
              onClick={() => setAdding(!adding)}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add Vehicle
            </button>
          </div>

          {adding && (
            <div className="mt-4 space-y-2 rounded-lg bg-navy p-3">
              <input className={inputCls} placeholder="Number (UK07AB1234)" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input className={inputCls} placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                <input className={inputCls} placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <input className={inputCls} placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button onClick={save} className="rounded-lg bg-brand-amber px-4 text-sm font-bold text-navy">
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {vehicles.length === 0 && !adding && (
              <p className="text-sm text-gray-500">No vehicles yet — use &ldquo;Add Vehicle&rdquo; above.</p>
            )}
            {vehicles.map((v) => (
              <Link
                key={v.id}
                href={`/passport?vid=${v.id}`}
                className="flex items-center gap-3 rounded-lg bg-navy p-3 transition hover:bg-navy-lighter"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-lighter">
                  <Car className="h-4 w-4 text-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-medium">{v.number}</p>
                  <p className="text-xs text-gray-500">
                    {[v.brand, v.model, v.type].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-gray-600" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {active.length > 0 && (
        <div className="rounded-xl border border-navy-border bg-navy-light p-6">
          <p className="font-semibold">Active Requests</p>
          <div className="mt-4 space-y-3">
            {active.map((b) => (
              <Link
                key={b.id}
                href={`/track?b=${b.code}`}
                className="flex flex-wrap items-center gap-3 rounded-lg bg-navy p-4 transition hover:bg-navy-lighter"
              >
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_TINT[b.status]}`}>
                  {STATUS_LABEL[b.status]}
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {b.service || b.problem} · {b.vehicleNumber || b.kind}
                  </p>
                  <p className="text-xs text-gray-500">
                    #{b.code} · {b.date} {b.slot && `· ${b.slot}`}
                  </p>
                </div>
                {b.etaMin && !["completed", "cancelled"].includes(b.status) ? (
                  <span className="text-xs text-brand-amber">ETA ~{b.etaMin} min</span>
                ) : null}
                <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-blue">
                  <Navigation className="h-3.5 w-3.5" /> Track on map
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {finished.length > 0 && (
        <div className="rounded-xl border border-navy-border bg-navy-light p-6">
          <p className="font-semibold">Rate your finished jobs</p>
          <p className="mt-1 text-sm text-gray-400">
            Your stars go on the provider&rsquo;s listing, the same one customers compare before booking.
          </p>
          <div className="mt-4 space-y-3">
            {finished.map((b) => (
              <div key={b.id} className="rounded-lg bg-navy p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {b.service || b.problem} · {b.vehicleNumber || b.kind}
                    </p>
                    <p className="text-xs text-gray-500">
                      #{b.code} · {b.date} · {b.mechanicName || "provider"}
                    </p>
                  </div>
                  <RateJob
                    booking={b}
                    existing={myRatings.find((x) => x.bookingId === b.id)}
                    onDone={() => refresh()}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-navy-border bg-navy-light p-6">
        <p className="font-semibold">Quick Services</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {QUICK.map((q) => (
            <Link
              key={q.title}
              href={q.href}
              className="group rounded-lg border border-white/5 bg-navy p-4 text-center transition hover:border-brand-blue/50"
            >
              <q.icon className="mx-auto h-6 w-6 text-brand-blue" />
              <p className="mt-3 text-sm font-medium">{q.title}</p>
              <p className="mt-1 text-xs text-gray-500">{q.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-navy-border bg-navy-light p-6">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Recent Activity</p>
          <Link href="/passport" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white">
            View Passport <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {records.length === 0 && (
            <div className="flex items-center gap-3 rounded-lg bg-navy p-3.5">
              <CalendarClock className="h-4 w-4 text-brand-amber" />
              <p className="text-sm text-gray-400">
                No service records yet — the first completed booking will appear here.
              </p>
            </div>
          )}
          {records.slice(0, 5).map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg bg-navy p-3.5">
              <span className="rounded-full bg-green-500/10 p-2 text-green-400">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium">
                  {r.service} — {r.vehicleNumber}
                </p>
                <p className="text-xs text-gray-500">
                  {r.date} · ₹{r.total} billed by {r.mechanicName} · {PAY_SHORT[r.paymentMode] || "Payment not recorded"}
                  {r.warrantyDays ? ` · ${r.warrantyDays}-day provider warranty` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
