"use client";


import Link from "next/link";
import ScreenWait from "@/components/ScreenWait";
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
import LocationField from "@/components/LocationField";
import { currentUser, bookingByCode, bookingsForCustomer, updateBooking } from "@/lib/db";
import { isPoint, jobPoint } from "@/lib/geo";
import { roadRoute } from "@/lib/route";
import { STATUS_LABEL, STATUS_TINT } from "@/data/services";

const TrackMap = dynamic(() => import("@/components/TrackMap"), { ssr: false });
const PinPicker = dynamic(() => import("@/components/TrackMap").then((m) => m.PinPicker), { ssr: false });

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Wrench, label: "Book Service", href: "/book" },
  { icon: Siren, label: "Emergency Help", href: "/emergency" },
  { icon: Activity, label: "Track a Job", href: "/track" },
  { icon: Car, label: "My Vehicles", href: "/dashboard" },
];

const STAGES = [
  { key: "pending", label: "Request placed", icon: Clock },
  { key: "assigned", label: "Provider accepted", icon: Wrench },
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
  const [pin, setPin] = useState({ point: null, accuracy: null });

  async function savePin() {
    if (!pin.point || !booking) return;
    await updateBooking(booking.id, { coord: pin.point, locAccuracy: pin.accuracy ?? null });
    setPin({ point: null, accuracy: null });
    setTick((n) => n + 1);
  }

  useEffect(() => {
    (async () => {
      try {
        const u = await currentUser();
        setUser(u);
        const q = new URLSearchParams(window.location.search).get("b");
        const list = u ? await bookingsForCustomer(u.id) : [];
        setMine(list);
        setCode(q || (list.find((b) => !["completed", "cancelled"].includes(b.status)) || list[0] || {}).code || null);
      } finally {
        setReady(true);
      }
    })();

    const t = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!code) return;
    let alive = true;
    (async () => {
      const b = await bookingByCode(code);
      if (!alive || !b) return;
      setBooking(b);
      setMechanic(
        b.mechanicId
          ? {
              name: b.mechanicName || "Provider",
              phone: b.mechanicPhone || "",
              area: b.mechanicArea || "",
              jobs: b.mechanicJobs || 0,
              upi: b.mechanicUpi || "",
            }
          : null
      );
    })();
    return () => {
      alive = false;
    };
  }, [code, tick]);

  const geo = useMemo(() => {
    if (!booking) return null;
    const job = jobPoint(booking);
    const from = isPoint(booking.mechanicCoord) ? booking.mechanicCoord : null;
    const lastAt = (booking.history || []).slice(-1)[0]?.t || booking.updatedAt || null;
    return {
      from,
      to: job.point,
      pair: from && job.point ? `${from.join(",")}>${job.point.join(",")}` : null,
      lastAt,
    };
  }, [booking]);

  const pair = geo?.pair || null;
  const [route, setRoute] = useState(null);

  useEffect(() => {
    if (!pair) {
      setRoute(null);
      return;
    }
    let alive = true;
    setRoute(null);
    const [a, b] = pair.split(">").map((s) => s.split(",").map(Number));
    roadRoute(a, b).then((r) => {
      if (alive) setRoute(r);
    });
    return () => {
      alive = false;
    };
  }, [pair]);

  if (!ready) return <ScreenWait />;

  const stageIdx = booking ? STAGES.findIndex((s) => s.key === booking.status) : -1;

  return (
    <AppShell items={NAV} active="Track a Job">
      {!booking && (
        <div className="rounded-xl border border-navy-border bg-navy-light p-8 text-center">
          <MapPin className="mx-auto h-8 w-8 text-brand-amber" />
          <h1 className="mt-3 text-lg font-bold">Nothing to track yet</h1>
          <p className="mt-1 text-sm text-gray-400">
            Book a service or raise an emergency request, and the map opens here.
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
              <Clock className="h-3.5 w-3.5" />
              {geo?.lastAt
                ? `Last update ${new Date(geo.lastAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                : "Refreshes on its own"}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <TrackMap
                from={geo?.from}
                to={geo?.to}
                route={route?.points}
                fromLabel="Provider base"
                toLabel="Your location"
              />
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-navy-border bg-navy-light p-4 text-center">
                  <p className="text-xs text-gray-500">Road distance</p>
                  <p className="mt-1 text-lg font-bold text-white">{route ? `${route.km} km` : "—"}</p>
                </div>
                <div className="rounded-xl border border-navy-border bg-navy-light p-4 text-center">
                  <p className="text-xs text-gray-500">Normal drive time</p>
                  <p className="mt-1 text-lg font-bold text-white">{route ? `${route.min} min` : "—"}</p>
                </div>
                <div className="rounded-xl border border-brand-amber/40 bg-brand-amber/10 p-4 text-center">
                  <p className="text-xs text-amber-200/70">Estimated arrival</p>
                  <p className="mt-1 text-lg font-bold text-brand-amber">
                    {booking.status === "completed"
                      ? "Done"
                      : route
                        ? `~${route.min} min`
                        : booking.etaMin
                          ? `~${booking.etaMin} min`
                          : "Not measured"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {route
                  ? `The line is the actual road your provider will take, measured by OpenStreetMap. Traffic and waits are not included, and VAHANOVA does not follow the vehicle while it drives.`
                  : !geo?.to
                    ? "This job has no location pin, so there is nothing to route to."
                    : !geo?.from
                      ? "Your provider has not set a base pin, so no route can be measured yet."
                      : "The pins are exact but the road route could not be fetched just now — try again in a moment."}
              </p>
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
                        {mechanic.area || "Dehradun"} · {mechanic.jobs || 0} job
                        {mechanic.jobs === 1 ? "" : "s"} completed
                      </p>
                    </div>
                  </div>
                  <a
                    href={`tel:${mechanic.phone}`}
                    className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white"
                  >
                    <Phone className="h-4 w-4" /> Call provider
                  </a>
                  <p className="mt-3 text-xs text-gray-500">
                    {route
                      ? "Arrival is the normal drive time on that road, from the pin your provider set. It is not a live position feed."
                      : "No route yet — it needs a base pin from the provider and a location pin from you."}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-navy-border bg-navy-light p-5 text-center">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-navy-border border-t-brand-amber" />
                  <p className="mt-3 text-sm font-semibold">Looking for a provider</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Your request is visible to every provider working in this area. The one who accepts will appear
                    here.
                  </p>
                </div>
              )}

              {booking && !geo?.to && (
                <div className="rounded-xl border border-brand-amber/40 bg-brand-amber/5 p-5">
                  <p className="text-sm font-semibold text-brand-amber">Share the exact spot</p>
                  <p className="mt-1 text-xs text-gray-400">
                    This job has no location pin, so nothing can be routed to you. Add one and the map draws the road
                    straight away.
                  </p>
                  <div className="mt-3">
                    <LocationField
                      label="Your location"
                      point={pin.point}
                      accuracy={pin.accuracy}
                      onChange={setPin}
                      hint="Use the GPS button, or tap the map at your lane or landmark."
                    />
                    <div className="mt-3">
                      <PinPicker point={pin.point} onChange={(p) => setPin({ point: p, accuracy: null })} />
                    </div>
                  </div>
                  <button
                    onClick={savePin}
                    disabled={!pin.point}
                    className="mt-3 w-full rounded-lg bg-brand-amber px-4 py-2.5 text-sm font-bold text-navy disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add pin to this job
                  </button>
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
                  Bill is in your passport <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          {mine.length > 1 && (
            <div className="rounded-xl border border-navy-border bg-navy-light p-5">
              <p className="text-sm font-semibold">Other requests</p>
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
