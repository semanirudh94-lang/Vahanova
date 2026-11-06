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
  ShieldCheck,
  Star,
  Download,
  CalendarClock,
  Wallet,
  MessageCircle,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { currentUser, myVehicles, recordsForVehicle, ratingsForCustomer } from "@/lib/db";
import { upiLink } from "@/lib/geo";
import { WA_LINK } from "@/data/site";

const PAY_LABEL = {
  cash: "Cash collected by the provider",
  upi: "Paid to the provider's UPI id",
  unpaid: "Not collected yet",
};

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Car, label: "My Vehicles", href: "/dashboard" },
  { icon: Wrench, label: "Book Service", href: "/book" },
  { icon: Siren, label: "Emergency Help", href: "/emergency" },
  { icon: FileText, label: "Documents", href: "/passport" },
  { icon: History, label: "Service History", href: "/passport" },
  { icon: User, label: "Profile", href: "/dashboard" },
];

export default function Passport() {
  const [ready, setReady] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [vid, setVid] = useState("");
  const [records, setRecords] = useState([]);
  const [myRatings, setMyRatings] = useState([]);

  useEffect(() => {
    (async () => {
      const vs = await myVehicles();
      const u = await currentUser();
      setMyRatings(u ? await ratingsForCustomer(u.id) : []);
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
          <h2 className="text-xl font-bold">Add a vehicle first</h2>
          <p className="mt-2 text-sm text-gray-400">Register your vehicle from the dashboard to start a passport.</p>
          <Link href="/dashboard" className="mt-5 inline-block rounded-lg bg-brand-amber px-6 py-3 font-semibold text-navy">
            Go to dashboard
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 print-hide">
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

          <div className="hidden print:mb-4 print:block">
            <p className="text-lg font-bold">VAHANOVA — Digital Vehicle Passport</p>
            <p className="text-xs">
              {vehicle.number} · printed {new Date().toLocaleDateString("en-IN")}
            </p>
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
                <MiniStat value={`₹${spent}`} label="Billed by providers" />
                <MiniStat value={new Date(records[0]?.date || Date.now()).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} label="Since" />
              </div>

              <div className="mt-6 border-t border-white/5 pt-5">
                <p className="text-sm font-semibold">Service history</p>
                <div className="mt-4 space-y-4">
                  {records.length === 0 && (
                    <div className="flex items-center gap-3 rounded-lg bg-navy p-4">
                      <CalendarClock className="h-4 w-4 text-brand-amber" />
                      <p className="text-sm text-gray-400">
                        No services recorded yet. The first completed booking appears here.
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

                      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-navy-lighter px-3 py-2 text-xs">
                        <Wallet className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="text-gray-300">
                          {PAY_LABEL[r.paymentMode] || "Payment not recorded"}
                          {r.paymentMode === "upi" && r.mechanicUpi ? ` · ${r.mechanicUpi}` : ""}
                        </span>
                        {r.mechanicUpi && (!r.paymentMode || r.paymentMode === "unpaid") ? (
                          <a
                            href={upiLink({ upi: r.mechanicUpi, name: r.mechanicName, amount: r.total, note: r.bookingCode })}
                            className="ml-auto rounded-lg bg-brand-blue px-3 py-1.5 font-semibold text-white print-hide"
                          >
                            Pay ₹{r.total} by UPI
                          </a>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {r.parts?.length > 0 && (
                          <span className="rounded bg-navy-lighter px-2 py-1 text-[11px] text-gray-300">
                            Parts and labour itemised
                          </span>
                        )}
                        {r.warrantyDays > 0 && (
                          <span className="rounded bg-navy-lighter px-2 py-1 text-[11px] text-gray-300">
                            {r.warrantyDays}-day warranty from {r.mechanicName}
                          </span>
                        )}
                        {myRatings.some((x) => x.bookingCode === r.bookingCode) && (
                          <span className="rounded bg-navy-lighter px-2 py-1 text-[11px] text-gray-300">
                            You rated this job {myRatings.find((x) => x.bookingCode === r.bookingCode).stars} star
                            {myRatings.find((x) => x.bookingCode === r.bookingCode).stars === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 print-hide">
                        {r.mechanicPhone && (
                          <a
                            href={`tel:${r.mechanicPhone}`}
                            className="rounded-lg border border-navy-border px-3 py-1.5 text-[11px] text-gray-300"
                          >
                            Call provider about this bill
                          </a>
                        )}
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `VAHANOVA bill #${r.bookingCode} — ${r.service} on ${r.date}, ₹${r.total}, serviced by ${r.mechanicName}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-navy-border px-3 py-1.5 text-[11px] text-gray-300"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Share bill on WhatsApp
                        </a>
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
                  {(vehicle.docs || []).length === 0 && (
                    <div className="flex items-center gap-3 rounded-lg bg-navy p-3">
                      <span className="rounded-full bg-navy-lighter p-2 text-gray-400">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">No documents on record</p>
                        <p className="text-xs text-gray-500">
                          RC, insurance and PUC upload is not built yet. Send them to us on WhatsApp and we will note
                          the dates for you.
                        </p>
                      </div>
                    </div>
                  )}
                  {(vehicle.docs || []).map((d) => (
                    <div key={d.name} className="flex items-center gap-3 rounded-lg bg-navy p-3">
                      <span className="rounded-full bg-navy-lighter p-2 text-gray-400">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">{d.name}</p>
                        <p className="text-xs text-gray-500">{d.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="print-hide mt-4 inline-block rounded-lg border border-navy-border px-4 py-2 text-xs text-gray-200 hover:border-white/30"
                >
                  Send documents on WhatsApp
                </a>
              </div>

              <div className="rounded-xl border border-brand-amber/30 bg-brand-amber/5 p-6">
                <p className="flex items-center gap-2 text-sm font-semibold text-brand-amber">
                  <Star className="h-4 w-4" /> Proof of maintenance
                </p>
                <p className="mt-2 text-sm text-gray-300">
                  This page lists every job done through VAHANOVA with the provider named and the parts billed. Hand
                  it to a buyer or an insurer as maintenance evidence.
                </p>
                <button
                  onClick={() => window.print()}
                  className="print-hide mt-4 inline-flex items-center gap-2 rounded-lg border border-navy-border px-4 py-2 text-xs text-gray-200 hover:border-white/30"
                >
                  <Download className="h-4 w-4" /> Save as PDF
                </button>
              </div>

              <Link
                href="/book"
                className="print-hide block rounded-xl border border-navy-border bg-navy-light p-6 text-center text-sm font-semibold text-brand-amber transition hover:border-brand-amber/50"
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
