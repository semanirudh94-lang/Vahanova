"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  Wrench,
  History,
  User,
  CheckCircle2,
  Play,
  IndianRupee,
  Plus,
  Trash2,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { currentUser, openRequestsForMechanic, acceptBooking, updateBooking, completeBooking } from "@/lib/db";
import { STATUS_LABEL, STATUS_TINT } from "@/data/services";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/mechanic" },
  { icon: Inbox, label: "Requests", href: "/mechanic" },
  { icon: Wrench, label: "My Jobs", href: "/mechanic" },
  { icon: History, label: "Completed", href: "/mechanic" },
  { icon: User, label: "Profile", href: "/mechanic" },
];

const inputCls =
  "w-full rounded-lg border border-navy-border bg-navy px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-brand-blue";

export default function Mechanic() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [list, setList] = useState([]);
  const [billing, setBilling] = useState(null);
  const [bill, setBill] = useState({ parts: [{ name: "", qty: 1, price: 0 }], labour: 499, warrantyDays: 30, note: "" });

  async function refresh() {
    const u = await currentUser();
    setUser(u);
    setList(u ? await openRequestsForMechanic(u.id) : []);
  }

  useEffect(() => {
    refresh().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  if (user?.role !== "mechanic") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Ye mechanic dashboard hai</h1>
        <p className="text-sm text-gray-400">Login karte waqt &ldquo;Service Provider&rdquo; chuno.</p>
        <Link href="/login" className="rounded-lg bg-brand-amber px-6 py-3 font-semibold text-navy">
          Login as Service Provider
        </Link>
      </div>
    );
  }

  const mine = list.filter((b) => b.mechanicId === user.id);
  const openPool = list.filter((b) => !b.mechanicId);
  const completed = mine.filter((b) => b.status === "completed");
  const today = mine.filter((b) => !["completed", "cancelled"].includes(b.status));

  async function start(b) {
    await updateBooking(b.id, { status: "in_progress" }, "in_progress");
    refresh();
  }

  async function onWay(b) {
    await updateBooking(b.id, { status: "on_way" }, "on_way");
    refresh();
  }

  async function saveBill() {
    await completeBooking(billing.id, bill);
    setBilling(null);
    setBill({ parts: [{ name: "", qty: 1, price: 0 }], labour: 499, warrantyDays: 30, note: "" });
    refresh();
  }

  const partsTotal = bill.parts.reduce((s, p) => s + (Number(p.qty) || 0) * (Number(p.price) || 0), 0);

  return (
    <AppShell items={NAV} active="Mechanic Dashboard">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Wrench} label="Active jobs" value={today.length} />
        <Stat icon={CheckCircle2} label="Completed" value={completed.length} tint="text-green-400 bg-green-500/10" />
        <Stat icon={IndianRupee} label="Total booked" value={`₹${mine.reduce((s, b) => s + (b.amount || 0), 0)}`} tint="text-brand-amber bg-brand-amber/10" />
        <Stat icon={User} label="Rating" value={user.rating ?? "New"} />
      </div>

      {openPool.length > 0 && (
        <div className="rounded-xl border border-brand-amber/40 bg-brand-amber/5 p-6">
          <p className="font-semibold text-brand-amber">New requests (koi bhi mechanic accept kar sakta hai)</p>
          <div className="mt-4 space-y-3">
            {openPool.map((b) => (
              <JobRow key={b.id} b={b}>
                <button
                  onClick={async () => {
                    await acceptBooking(b.id, user.id);
                    refresh();
                  }}
                  className="rounded-lg bg-brand-amber px-4 py-2 text-xs font-bold text-navy"
                >
                  Accept
                </button>
              </JobRow>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-navy-border bg-navy-light p-6">
        <p className="font-semibold">My Jobs</p>
        <div className="mt-4 space-y-3">
          {mine.length === 0 && (
            <p className="text-sm text-gray-500">
              Abhi koi job assign nahi hui. Customer booking karega to yahan dikhegi.
            </p>
          )}
          {mine.map((b) => (
            <JobRow key={b.id} b={b}>
              {b.status === "assigned" && (
                <button onClick={() => onWay(b)} className="rounded-lg bg-brand-blue px-4 py-2 text-xs font-semibold text-white">
                  Started / On the way
                </button>
              )}
              {b.status === "on_way" && (
                <button onClick={() => start(b)} className="rounded-lg bg-brand-blue px-4 py-2 text-xs font-semibold text-white">
                  Start service
                </button>
              )}
              {b.status === "in_progress" && (
                <button onClick={() => setBilling(b)} className="rounded-lg bg-brand-amber px-4 py-2 text-xs font-bold text-navy">
                  Complete &amp; bill
                </button>
              )}
              {b.status === "completed" && (
                <span className="text-xs text-green-400">₹{b.amount} collected</span>
              )}
            </JobRow>
          ))}
        </div>
      </div>

      {billing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-navy-border bg-navy-light p-6 sm:rounded-2xl">
            <p className="text-lg font-bold">Service Bill — #{billing.code}</p>
            <p className="mt-1 text-sm text-gray-400">
              {billing.service || billing.problem} · {billing.vehicleNumber}
            </p>

            <div className="mt-5 space-y-2">
              <p className="text-sm font-medium text-gray-300">Parts replaced</p>
              {bill.parts.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={`${inputCls} flex-1`}
                    placeholder="Part name"
                    value={p.name}
                    onChange={(e) => setBill({ ...bill, parts: bill.parts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                  />
                  <input
                    className={`${inputCls} w-16`}
                    type="number"
                    placeholder="Qty"
                    value={p.qty}
                    onChange={(e) => setBill({ ...bill, parts: bill.parts.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)) })}
                  />
                  <input
                    className={`${inputCls} w-24`}
                    type="number"
                    placeholder="Price"
                    value={p.price}
                    onChange={(e) => setBill({ ...bill, parts: bill.parts.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)) })}
                  />
                  <button
                    onClick={() => setBill({ ...bill, parts: bill.parts.filter((_, j) => j !== i) })}
                    className="rounded-lg border border-navy-border px-2 text-gray-400"
                    aria-label="Remove part"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setBill({ ...bill, parts: [...bill.parts, { name: "", qty: 1, price: 0 }] })}
                className="inline-flex items-center gap-1 text-xs text-brand-blue"
              >
                <Plus className="h-3.5 w-3.5" /> Add part
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Labour (₹)</label>
                <input className={inputCls} type="number" value={bill.labour} onChange={(e) => setBill({ ...bill, labour: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Warranty (days)</label>
                <input className={inputCls} type="number" value={bill.warrantyDays} onChange={(e) => setBill({ ...bill, warrantyDays: Number(e.target.value) })} />
              </div>
            </div>

            <input className={`${inputCls} mt-3`} placeholder="Note (kya check kiya, kya recommend kiya)" value={bill.note} onChange={(e) => setBill({ ...bill, note: e.target.value })} />

            <div className="mt-5 flex items-center justify-between rounded-lg bg-navy p-4 text-sm">
              <span className="text-gray-400">Total bill</span>
              <span className="text-xl font-extrabold text-brand-amber">₹{partsTotal + (Number(bill.labour) || 0)}</span>
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={saveBill} className="flex-1 rounded-lg bg-brand-amber py-3 font-bold text-navy">
                Save &amp; complete
              </button>
              <button onClick={() => setBilling(null)} className="rounded-lg border border-navy-border px-5 py-3 text-sm text-gray-300">
                Cancel
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Ye bill customer ke Vehicle Passport me seedha chala jayega — photo proof Month 3 me
              upload option ke saath aayega.
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function JobRow({ b, children }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-navy p-4">
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_TINT[b.status]}`}>{STATUS_LABEL[b.status]}</span>
      <div>
        <p className="text-sm font-medium">
          {b.service || b.problem} · {b.vehicleNumber || b.kind}
        </p>
        <p className="text-xs text-gray-500">
          #{b.code} · {b.customerName} · {b.address || "no address"} · {b.date}
          {b.slot && ` ${b.slot}`}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {b.customerPhone && (
          <a href={`tel:${b.customerPhone}`} className="rounded-lg border border-navy-border px-3 py-2 text-xs text-gray-300">
            Call customer
          </a>
        )}
        {children}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tint = "text-brand-blue bg-brand-blue/10" }) {
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
