"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  Siren,
  ArrowLeft,
  Loader2,
  Phone,
  CheckCircle2,
  MapPin,
  Navigation,
} from "lucide-react";
import { currentUser, createBooking, bookingById } from "@/lib/db";
import { areaCoord } from "@/lib/geo";
import { SITE } from "@/data/site";
import Brand from "@/components/Brand";
import LocationField from "@/components/LocationField";

const PinPicker = dynamic(() => import("@/components/TrackMap").then((m) => m.PinPicker), { ssr: false });

const PROBLEMS = ["Puncture", "Fuel — Petrol", "Fuel — Diesel", "Battery Jumpstart", "Towing", "Other"];
const VEHICLES = ["Bike", "Scooter", "Car"];

const TIMELINE = ["Request placed", "Provider accepted", "On the way", "Work in progress", "Completed"];

const inputCls =
  "w-full rounded-lg border border-navy-border bg-navy px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-brand-blue";

export default function Emergency() {
  const [step, setStep] = useState("form");
  const [bookingId, setBookingId] = useState(null);
  const [form, setForm] = useState({ problem: "", vehicle: "Bike", location: "", name: "", phone: "" });
  const [loc, setLoc] = useState({ point: null, accuracy: null });

  useEffect(() => {
    (async () => {
      const u = await currentUser();
      if (u) setForm((f) => ({ ...f, name: u.name, phone: u.phone }));
    })();
  }, []);

  const [booking, setBooking] = useState(null);
  const [mechanic, setMechanic] = useState(null);

  useEffect(() => {
    if (step !== "waiting" || !bookingId) return;
    let alive = true;
    async function load() {
      const b = await bookingById(bookingId);
      if (!alive || !b) return;
      setBooking(b);
      setMechanic(
        b.mechanicId
          ? { name: b.mechanicName || "Provider", phone: b.mechanicPhone || "", area: b.mechanicArea || "", jobs: b.mechanicJobs || 0 }
          : null
      );
    }
    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [step, bookingId]);

  const stageIndex = booking ? TIMELINE.findIndex((t) => t.toLowerCase().includes(STATUS_KEY[booking.status] || "")) : 0;

  async function submit(e) {
    e.preventDefault();
    const u = await currentUser();
    if (!u) {
      setStep("needlogin");
      return;
    }
    const b = await createBooking({
      kind: "emergency",
      problem: form.problem,
      service: form.problem,
      vehicleType: form.vehicle,
      vehicleNumber: form.vehicle,
      address: form.location,
      coord: loc.point,
      accuracy: loc.accuracy,
      amount: 0,
    });
    setBookingId(b.id);
    setBooking(b);
    setStep("waiting");
  }

  const ready = form.problem && form.name && (form.location || loc.point);
  const whereShown = form.location || (loc.point ? "GPS pin shared" : "");

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/5 bg-navy-light">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Brand markClass="h-6 w-auto" textClass="text-base" />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {step === "needlogin" ? (
          <div className="rounded-xl border border-navy-border bg-navy-light p-8 text-center">
            <h2 className="text-xl font-bold">Sign in to send this request</h2>
            <p className="mt-2 text-sm text-gray-400">
              Your request and its status are saved against your account.
            </p>
            <Link href="/login" className="mt-5 inline-block rounded-lg bg-brand-amber px-6 py-3 font-semibold text-navy">
              Login / Sign Up
            </Link>
          </div>
        ) : (
          <>
            <h1 className="flex items-center gap-3 text-3xl font-extrabold">
              <Siren className="h-8 w-8 text-brand-amber" /> Emergency Help
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Send the problem and your location. Providers working in {SITE.city} see it right away, and the first
              one to accept is assigned to you.
            </p>

            {step === "form" && (
              <form onSubmit={submit} className="mt-8 space-y-5 rounded-xl border border-navy-border bg-navy-light p-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Problem</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {PROBLEMS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm({ ...form, problem: p })}
                        className={`rounded-lg border px-3 py-2.5 text-sm transition ${
                          form.problem === p
                            ? "border-brand-amber bg-brand-amber/10 font-semibold text-brand-amber"
                            : "border-navy-border bg-navy text-gray-300 hover:border-white/30"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Vehicle</label>
                  <div className="flex gap-2">
                    {VEHICLES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setForm({ ...form, vehicle: v })}
                        className={`rounded-lg border px-4 py-2 text-sm transition ${
                          form.vehicle === v
                            ? "border-brand-blue bg-brand-blue/10 font-semibold text-white"
                            : "border-navy-border bg-navy text-gray-300 hover:border-white/30"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Your name</label>
                    <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Piyush" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Phone</label>
                    <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="The provider calls this number" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Location <span className="text-gray-500">— area or landmark</span>
                  </label>
                  <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Near ISBT, Rajpur Road" />
                </div>

                <div className="rounded-lg border border-navy-border bg-navy p-4">
                  <LocationField
                    label="Pin on the map"
                    point={loc.point}
                    accuracy={loc.accuracy}
                    onChange={(next) => setLoc(next)}
                    hint="Stranded on the road? Share the GPS pin so the provider does not have to ask you where you are."
                  />
                  <div className="mt-4">
                    <PinPicker
                      point={loc.point}
                      center={areaCoord(form.location)}
                      emptyHint="Cannot get a signal? Tap the map at your lane or landmark so the provider still has a pin."
                      onChange={(p) => setLoc({ point: p, accuracy: null })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!ready}
                  className="w-full rounded-lg bg-brand-amber px-6 py-3.5 text-base font-bold text-navy transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Request Emergency Help
                </button>
                <p className="text-xs text-gray-500">
                  The request stays open until a provider accepts it. If it is urgent, call {SITE.phoneDisplay} as
                  well.
                </p>
              </form>
            )}

            {step === "waiting" && !mechanic && (
              <div className="mt-16 flex flex-col items-center text-center">
                <Loader2 className="h-10 w-10 animate-spin text-brand-amber" />
                <h2 className="mt-6 text-2xl font-bold">Looking for a free provider…</h2>
                <p className="mt-2 text-sm text-gray-400">
                  {form.problem} · {form.vehicle} · {whereShown}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  This page updates on its own. Booking #{booking?.code}.
                </p>
              </div>
            )}

            {step === "waiting" && mechanic && booking && (
              <>
                <h2 className="mt-6 flex items-center gap-2 text-2xl font-bold">
                  <CheckCircle2 className="h-7 w-7 text-green-400" /> Provider accepted
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                  Request #{booking.code} — the status updates live below.
                </p>

                <div className="mt-6 rounded-xl border border-navy-border bg-navy-light p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy">
                      <Siren className="h-6 w-6 text-brand-amber" />
                    </div>
                    <div>
                      <p className="font-semibold">{mechanic.name}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="h-3.5 w-3.5" /> {mechanic.area || SITE.city} · to {form.location}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-center text-sm">
                    <div className="rounded-lg bg-navy p-3">
                      <p className="font-bold">{mechanic.jobs || 0}</p>
                      <p className="text-xs text-gray-500">Jobs on VAHANOVA</p>
                    </div>
                    <div className="rounded-lg bg-navy p-3">
                      <p className="font-bold text-brand-amber">{booking.etaMin ? `~${booking.etaMin} min` : "—"}</p>
                      <p className="text-xs text-gray-500">Estimated arrival</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${mechanic.phone}`}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    <Phone className="h-4 w-4" /> Call provider
                  </a>
                  <Link
                    href={`/track?b=${booking.code}`}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-amber/50 bg-brand-amber/10 px-5 py-3 text-sm font-semibold text-brand-amber"
                  >
                    <Navigation className="h-4 w-4" /> Track on map
                  </Link>
                  <p className="mt-3 text-xs text-gray-500">
                    The provider quotes the cost on the spot and is paid directly. VAHANOVA adds no fee to this job.
                  </p>
                </div>

                <div className="mt-6 rounded-xl border border-navy-border bg-navy-light p-6">
                  <p className="text-sm font-semibold">Status</p>
                  <ol className="mt-4 space-y-4">
                    {TIMELINE.map((t, i) => {
                      const done = i <= (stageIndex >= 0 ? stageIndex : 1);
                      return (
                        <li key={t} className="flex items-center gap-3">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              done ? "bg-brand-amber text-navy" : "bg-navy text-gray-600"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className={done ? "text-sm font-medium text-white" : "text-sm text-gray-500"}>
                            {t}
                            {i === (stageIndex >= 0 ? stageIndex : 1) && (
                              <span className="ml-2 text-xs text-brand-amber">now</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/dashboard" className="rounded-lg border border-navy-border px-5 py-2.5 text-sm font-medium text-gray-200 hover:border-white/30">
                    Track on my dashboard
                  </Link>
                  <button onClick={() => setStep("form")} className="rounded-lg px-5 py-2.5 text-sm text-gray-400 hover:text-white">
                    Raise another request
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const STATUS_KEY = {
  pending: "placed",
  assigned: "accepted",
  on_way: "way",
  in_progress: "progress",
  completed: "completed",
  cancelled: "placed",
};
