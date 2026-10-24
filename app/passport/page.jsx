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
  ShoppingCart,
  User,
  ShieldCheck,
  Star,
  Download,
  CalendarClock,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { currentUser, myVehicles, recordsForVehicle } from "@/lib/db";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Car, label: "My Vehicles", href: "/dashboard" },
  { icon: Wrench, label: "Book Service", href: "/book" },
  { icon: Siren, label: "Emergency Help", href: "/emergency" },
  { icon: FileText, label: "Documents", href: "/passport" },
  { icon: History, label: "Service History", href: "/passport" },
  { icon: ShoppingCart, label: "Buy Parts", href: "/dashboard" },
  { icon: User, label: "Profile", href: "/dashboard" },
];

const DOCS = [
  { name: "RC (Registration)", tag: "Uploaded", tint: "text-green-400 bg-green-500/10" },
  { name: "Insurance", tag: "Renew by 05 Aug 2027", tint: "text-brand-amber bg-brand-amber/10" },
  { name: "PUC Certificate", tag: "Valid till 12 Mar 2027", tint: "text-green-400 bg-green-500/10" },
];

export default function Passport() {
  const [ready, setReady] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [vid, setVid] = useState("");
  const [records, setRecords] = useState([]);

  useEffect(() => {
    (async () => {
      const vs = await myVehicles();
      setVehicles(vs);
      const q = new URLSearchParams(window.location.search).get("vid");
      setVid(q && vs.some((v) => v.id === q) ? q : vs[0]?.id || "");
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!vid) {
      setRecords([]);
      return;
    }
    recordsForVehicle(vid).then(setRecords);
  }, [vid]);

  if (!ready) return null;

  const vehicle = vehicles.find((v) => v.id === vid);
  const spent = records.reduce((s, r) => s + (r.total || 0), 0);
  const inWarranty = records.find((r) => new Date(r.date).getTime() + r.warrantyDays * 864e5 > Date.now());

  return (
    <AppShell items={NAV} active="Vehicle Passport">
      {vehicles.length === 0 ? (
        <div className="rounded-xl border border-navy-border bg-navy-light p-8 text-center">
          <h2 className="text-xl font-bold">Pehle vehicle add karo</h2>
          <p className="mt-2 text-sm text-gray-400">Dashboard pe &ldquo;Add Vehicle&rdquo; se apni gaadi register karo.</p>
          <Link href="/dashboard" className="mt-5 inline-block rounded-lg bg-brand-amber px-6 py-3 font-semibold text-navy">
            Go to dashboard
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => setVid(v.id)}
                className={`rounded-lg border px-4 py-2 text-sm transition ${
                  vid === v.id ? "border-brand-amber bg-brand-amber/10 font-semibold text-brand-amber" : "border-navy-border bg-navy text-gray-300"
                }`}
              >
                {v.number}
              </button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-navy-border bg-navy-light p-6 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Digital Vehicle Passport</p>
                  <h1 className="mt-1 text-2xl font-extrabold">{vehicle.number}</h1>
                  <p className="text-sm text-gray-400">
                    {vehicle.brand} {vehicle.model} {vehicle.year && `· ${vehicle.year}`}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400">
                  <ShieldCheck className="h-4 w-4" />
                  {inWarranty ? `${inWarranty.warrantyDays}-day warranty active` : "No active warranty"}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <MiniStat value={records.length} label="Services" />
                <MiniStat value={`₹${spent}`} label="Total spent" />
                <MiniStat value={new Date(records[0]?.date || Date.now()).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} label="Since" />
              </div>

              <div className="mt-6 border-t border-white/5 pt-5">
                <p className="text-sm font-semibold">Service history</p>
                <div className="mt-4 space-y-4">
                  {records.length === 0 && (
                    <div className="flex items-center gap-3 rounded-lg bg-navy p-4">
                      <CalendarClock className="h-4 w-4 text-brand-amber" />
                      <p className="text-sm text-gray-400">
                        Koi service nahi hui abhi. Pehli service ke baad record yahan judega.
                      </p>
                    </div>
                  )}
                  {records.map((r) => (
                    <div key={r.id} className="rounded-lg bg-navy p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{r.service}</p>
                        <p className="text-sm font-bold text-brand-amber">₹{r.total}</p>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {r.date} · #{r.bookingCode} · {r.mechanicName}
                      </p>
                      {r.parts?.length > 0 && (
                        <div className="mt-3 space-y-1 border-t border-white/5 pt-3 text-xs">
                          {r.parts.map((p, i) => (
                            <div key={i} className="flex justify-between">
                              <span className="text-gray-400">
                                {p.name} × {p.qty}
                              </span>
                              <span>₹{p.qty * p.price}</span>
                            </div>
                          ))}
                          <div className="flex justify-between border-t border-white/5 pt-1 font-medium">
                            <span className="text-gray-400">Labour</span>
                            <span>₹{r.labour}</span>
                          </div>
                        </div>
                      )}
                      {r.note && <p className="mt-2 text-xs italic text-gray-500">{r.note}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded bg-navy-lighter px-2 py-1 text-[11px] text-gray-300">Bill attached</span>
                        <span className="rounded bg-navy-lighter px-2 py-1 text-[11px] text-gray-300">{r.warrantyDays}-day warranty</span>
                        <span className="rounded bg-navy-lighter px-2 py-1 text-[11px] text-gray-300">Photo proof (Month 3)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-navy-border bg-navy-light p-6">
                <p className="text-sm font-semibold">Documents</p>
                <div className="mt-4 space-y-3">
                  {DOCS.map((d) => (
                    <div key={d.name} className="flex items-center gap-3 rounded-lg bg-navy p-3">
                      <span className={`rounded-full p-2 ${d.tint}`}>
                        <FileText className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">{d.name}</p>
                        <p className="text-xs text-gray-500">{d.tag}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Document upload + expiry reminders Month 2 me real honge.
                </p>
              </div>

              <div className="rounded-xl border border-brand-amber/30 bg-brand-amber/5 p-6">
                <p className="flex items-center gap-2 text-sm font-semibold text-brand-amber">
                  <Star className="h-4 w-4" /> Resale value
                </p>
                <p className="mt-2 text-sm text-gray-300">
                  Full service history wala vehicle market me 5-8% zyada bikta hai. Ye passport
                  buyer ko dikhane ke liye hai.
                </p>
                <button className="mt-4 inline-flex items-center gap-2 rounded-lg border border-navy-border px-4 py-2 text-xs text-gray-200">
                  <Download className="h-4 w-4" /> Download PDF
                </button>
              </div>

              <Link
                href="/book"
                className="block rounded-xl border border-navy-border bg-navy-light p-6 text-center text-sm font-semibold text-brand-amber transition hover:border-brand-amber/50"
              >
                Book next service
              </Link>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function MiniStat({ value, label }) {
  return (
    <div className="rounded-lg bg-navy p-3">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] text-gray-500">{label}</p>
    </div>
  );
}
