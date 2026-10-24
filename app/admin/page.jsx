"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutDashboard, Inbox, Users, Wrench, IndianRupee, ShieldCheck } from "lucide-react";
import AppShell from "@/components/AppShell";
import { allBookings, mechanics, assignBooking, stats } from "@/lib/db";
import { STATUS_LABEL, STATUS_TINT } from "@/data/services";

const NAV = [
  { icon: LayoutDashboard, label: "Overview", href: "/admin" },
  { icon: Inbox, label: "All Requests", href: "/admin" },
  { icon: Users, label: "Customers", href: "/admin" },
  { icon: Wrench, label: "Mechanics", href: "/admin" },
];

export default function Admin() {
  const [ready, setReady] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [mechs, setMechs] = useState([]);
  const [totals, setTotals] = useState(null);
  const [filter, setFilter] = useState("all");

  async function refresh() {
    setBookings(await allBookings());
    setMechs(await mechanics());
    setTotals(await stats());
  }

  useEffect(() => {
    refresh().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  const rows = bookings.filter((b) => filter === "all" || b.status === filter);

  return (
    <AppShell items={NAV} active="Dispatch / Admin">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card icon={Inbox} label="Total requests" value={totals.bookings} />
        <Card icon={ShieldCheck} label="Open" value={totals.open} tint="text-brand-amber bg-brand-amber/10" />
        <Card icon={Users} label="Customers" value={totals.customers} />
        <Card icon={Wrench} label="Mechanics" value={totals.mechanics} />
        <Card icon={IndianRupee} label="Billed value" value={`₹${totals.revenue}`} tint="text-green-400 bg-green-500/10" />
      </div>

      <div className="rounded-xl border border-navy-border bg-navy-light p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold">All Requests</p>
          <div className="flex flex-wrap gap-2">
            {["all", "pending", "assigned", "on_way", "in_progress", "completed"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs transition ${
                  filter === s ? "bg-brand-blue text-white" : "bg-navy text-gray-400 hover:text-white"
                }`}
              >
                {s === "all" ? "All" : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Service</th>
                <th className="py-2 pr-4">Vehicle</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2">Assign mechanic</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">
                    Abhi koi request nahi — /book ya /emergency se banao.
                  </td>
                </tr>
              )}
              {rows.map((b) => (
                <tr key={b.id} className="border-t border-white/5">
                  <td className="py-3 pr-4 text-xs text-gray-500">#{b.code}</td>
                  <td className="py-3 pr-4">
                    <p className="font-medium">{b.customerName}</p>
                    <p className="text-xs text-gray-500">{b.customerPhone}</p>
                  </td>
                  <td className="py-3 pr-4">{b.service || b.problem}</td>
                  <td className="py-3 pr-4 text-gray-400">{b.vehicleNumber || "—"}</td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${STATUS_TINT[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                  </td>
                  <td className="py-3 pr-4">{b.amount ? `₹${b.amount}` : "—"}</td>
                  <td className="py-3">
                    <select
                      value={b.mechanicId || ""}
                      onChange={async (e) => {
                        if (e.target.value) await assignBooking(b.id, e.target.value);
                        refresh();
                      }}
                      className="rounded-lg border border-navy-border bg-navy px-2 py-1.5 text-xs text-gray-200"
                    >
                      <option value="">Unassigned</option>
                      {mechs.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} — {m.area}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-navy-border bg-navy-light p-6">
        <p className="font-semibold">Mechanic Pool</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {mechs.map((m) => (
            <div key={m.id} className="rounded-lg bg-navy p-4">
              <p className="font-medium">{m.name}</p>
              <p className="text-xs text-gray-500">{m.area}</p>
              <p className="mt-2 text-xs text-gray-400">
                {m.jobs} jobs · {m.rating} rating
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500">
          Ye page abhi public hai — Month 2 me role-based auth (founder only) lagega. Live deploy se
          pehle isse password-protect karna zaroori hai.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm text-brand-blue">
          Back to customer view
        </Link>
      </div>
    </AppShell>
  );
}

function Card({ icon: Icon, label, value, tint = "text-brand-blue bg-brand-blue/10" }) {
  return (
    <div className="rounded-xl border border-navy-border bg-navy-light p-5">
      <span className={`inline-flex rounded-lg p-2 ${tint}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
