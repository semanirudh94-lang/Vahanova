"use client";


import Link from "next/link";
import ScreenWait from "@/components/ScreenWait";
import { useEffect, useState } from "react";
import { LayoutDashboard, Inbox, Users, Wrench, IndianRupee, ShieldCheck } from "lucide-react";
import AppShell from "@/components/AppShell";
import { allBookings, mechanics, assignBooking, stats, currentUser, isLive, migrateLegacyPublicRatings } from "@/lib/db";
import { SITE } from "@/data/site";
import { STATUS_LABEL, STATUS_TINT } from "@/data/services";

const NAV = [
  { icon: LayoutDashboard, label: "Overview", href: "/admin" },
  { icon: Inbox, label: "All Requests", href: "/admin" },
  { icon: Users, label: "Customers", href: "/admin" },
  { icon: Wrench, label: "Providers", href: "/admin" },
];

// Firestore rules enforce this too, so a modified browser cannot get past either layer.
function isAllowed(user) {
  if (!isLive) return true;
  return (user.email || "").toLowerCase() === SITE.email.toLowerCase();
}

export default function Admin() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [mechs, setMechs] = useState([]);
  const [totals, setTotals] = useState(null);
  const [filter, setFilter] = useState("all");
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState("");

  async function refresh() {
    setBookings(await allBookings());
    setMechs(await mechanics());
    setTotals(await stats());
  }

  useEffect(() => {
    (async () => {
      try {
        const u = await currentUser();
        setUser(u);
        if (u && isAllowed(u)) await refresh();
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) return <ScreenWait />;

  if (!user || !isAllowed(user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldCheck className="h-9 w-9 text-brand-amber" />
        <h1 className="text-xl font-bold">This area is restricted</h1>
        <p className="max-w-sm text-sm text-gray-400">
          The dispatch board is only available to the VAHANOVA operator account.
        </p>
        <Link
          href="/login"
          className="rounded-lg bg-brand-amber px-6 py-3 font-semibold text-navy transition hover:brightness-110"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const rows = bookings.filter((b) => filter === "all" || b.status === filter);

  return (
    <AppShell items={NAV} active="Dispatch / Admin">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card icon={Inbox} label="Total requests" value={totals.bookings} />
        <Card icon={ShieldCheck} label="Open" value={totals.open} tint="text-brand-amber bg-brand-amber/10" />
        <Card icon={Users} label="Customers" value={totals.customers} />
        <Card icon={Wrench} label="Providers" value={totals.mechanics} />
        <Card icon={IndianRupee} label="Billed by providers" value={`₹${totals.billed}`} tint="text-green-400 bg-green-500/10" />
        <Card icon={ShieldCheck} label="VAHANOVA commission" value="₹0" />
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
                    No requests yet.
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Legacy review migration</p>
            <p className="mt-1 text-xs text-gray-500">Copies only public review fields from older private ratings. Safe to run more than once.</p>
          </div>
          <button
            type="button"
            disabled={migrationBusy}
            onClick={async () => {
              setMigrationBusy(true);
              setMigrationMessage("");
              try {
                const count = await migrateLegacyPublicRatings();
                setMigrationMessage(`Migrated ${count} review(s).`);
              } catch (error) {
                setMigrationMessage(error?.message || "Review migration failed.");
              } finally {
                setMigrationBusy(false);
              }
            }}
            className="rounded-lg border border-navy-border px-4 py-2 text-xs font-semibold text-gray-200 disabled:opacity-50"
          >
            {migrationBusy ? "Migrating…" : "Migrate old reviews"}
          </button>
        </div>
        {migrationMessage && <p className="mt-2 text-xs text-brand-amber">{migrationMessage}</p>}
      </div>

      <div className="rounded-xl border border-navy-border bg-navy-light p-6">
        <p className="font-semibold">Provider Pool</p>
        {mechs.length === 0 && (
          <p className="mt-4 text-sm text-gray-500">No providers have signed up yet.</p>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {mechs.map((m) => (
            <div key={m.id} className="rounded-lg bg-navy p-4">
              <p className="font-medium">{m.name}</p>
              <p className="text-xs text-gray-500">{m.area || "Area not set"}</p>
              <p className="mt-2 text-xs text-gray-400">
                {m.jobs || 0} job{m.jobs === 1 ? "" : "s"} completed
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500">
          This board is limited to the VAHANOVA operator account. The matching database-level lock lives in
          <code className="mx-1 rounded bg-navy px-1.5 py-0.5">firestore.rules</code>
          and is only enforced once those rules are deployed in the Firebase console.
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
