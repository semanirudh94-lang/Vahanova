"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Car,
  ChevronRight,
  Clock,
  LayoutDashboard,
  MapPin,
  Navigation,
  Phone,
  Siren,
  Star,
  Wrench,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { currentUser, bookingByCode, bookingsForCustomer, userById } from "@/lib/db";
import { addressCoord, livePosition, distanceKm } from "@/lib/geo";
import { STATUS_LABEL, STATUS_TINT } from "@/data/services";

const TrackMap = dynamic(() => import("@/components/TrackMap"), { ssr: false });

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Wrench, label: "Book Service", href: "/book" },
  { icon: Siren, label: "Emergency Help", href: "/emergency" },
  { icon: Activity, label: "Live Tracking", href: "/track" },
  { icon: Car, label: "My Vehicles", href: "/dashboard" },
];

const STAGES = [
  { key: "pending", label: "Request placed", icon: Clock },
  { key: "assigned", label: "Mechanic assigned", icon: Wrench },
  { key: "on_way", label: "On the way", icon: Navigation },
  { key: "in_progress", label: "Service in progress", icon: Car },
  { key: "completed", label: "Completed", icon: Star },
];

export default function Track() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [code, setCode] = useState(null);
  const [tick, setTick] = useState(0);

  const [booking, setBooking] = useState(null);
  const [mechanic, setMechanic] = useState(null);
  const [mine, setMine] = useState([]);

  useEffect(() => {
    (async () => {
      const u = await currentUser();
      setUser(u);
      const q = new URLSearchParams(window.location.search).get("b");
      const list = u ? await bookingsForCustomer(u.id) : [];
      setMine(list);
      setCode(q || (list.find((b) => !["completed", "cancelled"].includes(b.status)) || list[0] || {}).code || null);
      setReady(true);
    })();

    const t = setInterval(() => setTick((n) => n + 1), 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!code) return;
    let alive = true;
    (async () => {
      const b = await bookingByCode(code);
      if (!alive || !b) return;
      setBooking(b);
      setMechanic(b.mechanicId ? await userById(b.mechanicId) : null);
    })();
    return () => {
      alive = false;
    };
  }, [code, tick]);

  const geo = useMemo(() => {
    if (!booking) return null;
    const to = addressCoord(booking.address || "");
    const from = mechanic && mechanic.coord ? mechanic.coord : [30.3163, 78.0333];
    const leftAt = (booking.history || []).filter((h) => h.s === "on_way").slice(-1)[0]?.t || null;
    return { to, from, leftAt, live: livePosition({ from, to, leftAt, etaMin: booking.etaMin, status: booking.status }) };
  }, [booking, mechanic]);

  if (!ready) return null;

  const stageIdx = booking ? STAGES.findIndex((s) => s.key === booking.status) : -1;
  const km = geo ? distanceKm(geo.from, geo.to) : 0;

  return (
    <AppShell items={NAV} active="Live Tracking">
      {!booking && (
        <div className="rounded-xl border border-navy-border bg-navy-light p-8 text-center">
          <MapPin className="mx-auto h-8 w-8 text-brand-amber" />
          <h1 className="mt-3 text-lg font-bold">Koi request track karne ko nahi hai</h1>
          <p className="mt-1 text-sm text-gray-400">
            Pehle service book karo ya emergency help maango — phir yahan live map khulega.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/book" className="rounded-lg bg-brand-amber px-5 py-2.5 text-sm font-bold text-navy">
              Book a Service
            </Link>
            <Link href="/emergency" className="rounded-lg border border-navy-border px-5 py-2.5 text-sm font-medium text-gray-200">
              Emergency Help
            </Link>
          </div>
        </div>
      )}

      {booking && (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-navy-border bg-navy-light p-4">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_TINT[booking.status]}`}>
              {STATUS_LABEL[booking.status]}
            </span>
            <div>
              <p className="text-sm font-semibold">
                {booking.service || booking.problem || "Emergency help"} · {booking.vehicleNumber || booking.kind}
              </p>
              <p className="text-xs text-gray-500">
                #{booking.code} · {booking.date} {booking.slot && `· ${booking.slot}`} · {booking.address || "Address on call"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              Live · har 2 sec me update
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <TrackMap
                route={geo.live.route}
                from={geo.from}
                to={geo.to}
                at={geo.live.at}
                showMechanic={booking.status !== "pending" && booking.status !== "cancelled"}
              />
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-navy-border bg-navy-light p-4 text-center">
                  <p className="text-xs text-gray-500">Door hai</p>
                  <p className="mt-1 text-lg font-bold text-white">{km.toFixed(1)} km</p>
                </div>
                <div className="rounded-xl border border-navy-border bg-navy-light p-4 text-center">
                  <p className="text-xs text-gray-500">Mechanic ki doori</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {geo.live.arrived ? "Pahuncho gaye" : `${(km * (1 - geo.live.progress)).toFixed(1)} km`}
                  </p>
                </div>
                <div className="rounded-xl border border-brand-amber/40 bg-brand-amber/10 p-4 text-center">
                  <p className="text-xs text-amber-200/70">Anuman ETA</p>
                  <p className="mt-1 text-lg font-bold text-brand-amber">
                    {geo.live.arrived ? "0 min" : `${geo.live.minsLeft} min`}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {mechanic ? (
                <div className="rounded-xl border border-navy-border bg-navy-light p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue text-base font-bold">
                      {mechanic.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{mechanic.name}</p>
                      <p className="text-xs text-gray-500">
                        {mechanic.area} · {mechanic.jobs} jobs · ⭐ {mechanic.rating}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`tel:${mechanic.phone}`}
                    className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white"
                  >
                    <Phone className="h-4 w-4" /> Call mechanic
                  </a>
                  <p className="mt-3 text-xs text-gray-500">
                    Tracker mechanic ke garage se tera address tak ka rasta dikhata hai. asli GPS location
                    Month 2 me mechanic app ke through aayegi.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-navy-border bg-navy-light p-5 text-center">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-navy-border border-t-brand-amber" />
                  <p className="mt-3 text-sm font-semibold">Sabse nazdeeki mechanic dhundha ja raha hai</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {km.toFixed(1)} km ke radius me — 1-2 min me naam aur photo yahan aa jayega.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-navy-border bg-navy-light p-5">
                <p className="text-sm font-semibold">Progress</p>
                <ol className="mt-4 space-y-4">
                  {STAGES.map((s, i) => {
                    const done = i < stageIdx;
                    const current = i === stageIdx;
                    return (
                      <li key={s.key} className="flex gap-3">
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                            done ? "bg-green-500/15 text-green-400" : current ? "bg-brand-amber text-navy" : "bg-navy text-gray-600"
                          }`}
                        >
                          {done ? "✓" : i + 1}
                        </span>
                        <div>
                          <p className={`text-sm ${current ? "font-semibold text-white" : done ? "text-gray-300" : "text-gray-600"}`}>
                            {s.label}
                          </p>
                          {(booking.history || [])[i]?.t && (
                            <p className="text-[11px] text-gray-500">
                              {new Date(booking.history[i].t).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {booking.status === "completed" && booking.vehicleId && (
                <Link
                  href={`/passport?vid=${booking.vehicleId}`}
                  className="flex items-center justify-between rounded-xl border border-brand-amber/40 bg-brand-amber/10 p-4 text-sm font-semibold text-brand-amber"
                >
                  Bill passport me save hai — dekho <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          {mine.length > 1 && (
            <div className="rounded-xl border border-navy-border bg-navy-light p-5">
              <p className="text-sm font-semibold">Doosri requests</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {mine.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setCode(b.code)}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                      b.code === code ? "bg-brand-blue text-white" : "bg-navy text-gray-300 hover:bg-navy-lighter"
                    }`}
                  >
                    #{b.code} · {STATUS_LABEL[b.status]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
