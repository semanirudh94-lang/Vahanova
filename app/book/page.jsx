"use client";


import Link from "next/link";
import ScreenWait from "@/components/ScreenWait";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Car, CalendarClock, SlidersHorizontal } from "lucide-react";
import { currentUser, myVehicles, addVehicle, createBooking, providerOffers } from "@/lib/db";
import { SERVICES, SLOTS, VEHICLE_TYPES, SERVICE_MODES } from "@/data/services";
import { DEHRADUN_AREAS, areaCoord } from "@/lib/geo";
import { SITE } from "@/data/site";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Brand from "@/components/Brand";
import LocationField from "@/components/LocationField";
import Stars from "@/components/Stars";

const PinPicker = dynamic(() => import("@/components/TrackMap").then((m) => m.PinPicker), { ssr: false });

const STEPS = ["Select Service", "Vehicle & Address", "Choose Provider", "Date & Confirm"];

const inputCls =
  "w-full rounded-lg border border-navy-border bg-navy px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-brand-blue";

export default function Book() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [vehicleId, setVehicleId] = useState("");
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0]);
  const [newVehicle, setNewVehicle] = useState({ number: "", brand: "", model: "", year: "", type: VEHICLE_TYPES[0] });
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [loc, setLoc] = useState({ point: null, accuracy: null });
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState(SLOTS[0]);
  const [pick, setPick] = useState(null);
  const [done, setDone] = useState(null);

  const [filters, setFilters] = useState({ mode: "", area: "", maxPrice: "", sort: "price" });
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await currentUser();
        setUser(u);
        if (u?.phone) setContact(u.phone);
        setVehicles(await myVehicles());
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (step !== 2 || !service) return;
    let live = true;
    setLoadingOffers(true);
    providerOffers({
      serviceKey: service.key,
      vehicleType,
      address,
      point: loc.point,
      mode: filters.mode,
      area: filters.area,
      maxPrice: filters.maxPrice,
      sort: filters.sort,
    }).then((list) => {
      if (live) {
        setOffers(list);
        setLoadingOffers(false);
      }
    });
    return () => {
      live = false;
    };
  }, [step, service, vehicleType, address, loc.point, filters]);

  async function saveNewVehicle() {
    if (!newVehicle.number || !newVehicle.brand) return;
    const v = await addVehicle(newVehicle);
    setVehicles((prev) => [...prev, v]);
    setVehicleId(v.id);
    setVehicleType(v.type || vehicleType);
    setNewVehicle({ number: "", brand: "", model: "", year: "", type: VEHICLE_TYPES[0] });
  }

  async function confirm() {
    const v = vehicles.find((x) => x.id === vehicleId);
    const b = await createBooking({
      kind: "service",
      service: service.name,
      serviceKey: service.key,
      vehicleId: v ? v.id : null,
      vehicleNumber: v ? v.number : "",
      vehicleType,
      address,
      coord: loc.point,
      accuracy: loc.accuracy,
      customerPhone: contact,
      date: date || new Date().toISOString().slice(0, 10),
      slot,
      amount: pick.price,
      mechanicId: pick.ownerId,
      etaMin: pick.etaMin,
    });
    setDone({ ...b, providerName: pick.name, providerPhone: pick.phone, providerArea: pick.area });
  }

  if (!ready) return <ScreenWait />;

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Sign in to book</h1>
        <Link href="/login" className="rounded-lg bg-brand-amber px-6 py-3 font-semibold text-navy">
          Login / Sign Up
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-navy-border bg-navy-light p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" />
          <h1 className="mt-4 text-2xl font-bold">Booking confirmed</h1>
          <p className="mt-2 text-sm text-gray-400">
            Your booking is saved. Provider contact details appear once the provider opens the assigned job.
          </p>
          <div className="mt-6 space-y-2 rounded-xl bg-navy p-5 text-left text-sm">
            <Row k="Booking ID" v={done.code} />
            <Row k="Service" v={done.service} />
            <Row k="Provider" v={`${done.providerName} · ${done.providerArea || "Dehradun"}`} />
            <Row k="Provider contact" v={done.providerPhone || "Shared when provider opens the assigned job"} />
            <Row k="Vehicle" v={done.vehicleNumber || "—"} />
            <Row k="Date" v={`${done.date} · ${done.slot}`} />
            <Row k="Address" v={done.address || "—"} />
            <Row k="Map pin" v={done.coord ? "GPS pin shared with your provider" : "No GPS pin — the provider will call you"} />
            <Row k="Provider's rate" v={done.amount ? `₹${done.amount}` : "Quoted after inspection"} />
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Payment is made directly to the service provider after the work is done. VAHANOVA does not collect
            payment and adds no fee or commission to this booking.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={`/track?b=${done.code}`} className="rounded-lg bg-brand-amber px-6 py-3 font-semibold text-navy">
              Track on map
            </Link>
            <Link href="/dashboard" className="rounded-lg border border-navy-border px-6 py-3 text-sm font-medium text-gray-200">
              Dashboard
            </Link>
            <Link href="/book" className="rounded-lg border border-navy-border px-6 py-3 text-sm font-medium text-gray-200">
              Book another
            </Link>
          </div>
        </div>
        <WhatsAppFloat />
      </div>
    );
  }

  const selectedVehicle = vehicles.find((x) => x.id === vehicleId);

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/5 bg-navy-light">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Brand markClass="h-6 w-auto" textClass="text-base" />
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold">Book a Service</h1>

        <div className="mt-6 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col gap-2">
              <span className={`h-1 rounded-full ${i <= step ? "bg-brand-amber" : "bg-navy-border"}`} />
              <span className={`text-[11px] ${i <= step ? "text-gray-200" : "text-gray-600"}`}>{s}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-navy-border bg-navy-light p-6">
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {SERVICES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setService(s)}
                  className={`rounded-xl border p-4 text-left transition ${
                    service?.key === s.key
                      ? "border-brand-amber bg-brand-amber/10"
                      : "border-navy-border bg-navy hover:border-white/30"
                  }`}
                >
                  <span className="font-semibold">{s.name}</span>
                  <p className="mt-1 text-xs text-gray-400">{s.desc}</p>
                  <p className="mt-2 text-xs text-brand-amber">Providers set their own price</p>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="mb-3 text-sm font-medium text-gray-300">Select your vehicle</p>
                {vehicles.length === 0 && (
                  <p className="rounded-lg bg-navy p-3 text-sm text-gray-400">No vehicles yet — add one below.</p>
                )}
                <div className="space-y-2">
                  {vehicles.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setVehicleId(v.id);
                        if (v.type) setVehicleType(v.type);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                        vehicleId === v.id ? "border-brand-amber bg-brand-amber/10" : "border-navy-border bg-navy hover:border-white/30"
                      }`}
                    >
                      <Car className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">{v.number}</span>
                      <span className="text-sm text-gray-500">
                        {v.brand} {v.model}
                      </span>
                      {v.type && <span className="ml-auto text-xs text-gray-500">{v.type}</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-navy-border p-4">
                <p className="mb-3 text-sm font-medium text-gray-300">Add a vehicle</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={inputCls} placeholder="Vehicle number (UK07AB1234)" value={newVehicle.number} onChange={(e) => setNewVehicle({ ...newVehicle, number: e.target.value })} />
                  <input className={inputCls} placeholder="Brand (Honda)" value={newVehicle.brand} onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })} />
                  <input className={inputCls} placeholder="Model (Activa 6G)" value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} />
                  <input className={inputCls} placeholder="Year (2021)" value={newVehicle.year} onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })} />
                  <select className={inputCls} value={newVehicle.type} onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}>
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <button onClick={saveNewVehicle} className="mt-3 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white">
                  Add vehicle
                </button>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-300">Vehicle type</p>
                <div className="flex gap-2">
                  {VEHICLE_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setVehicleType(t)}
                      className={`flex-1 rounded-lg border px-3 py-2.5 text-sm ${
                        vehicleType === t ? "border-brand-amber bg-brand-amber/10 font-semibold text-brand-amber" : "border-navy-border bg-navy text-gray-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-300">Pickup / service address</p>
                <textarea className={inputCls} rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder={`Flat / shop, area, landmark — ${SITE.city}`} />
              </div>

              <div className="rounded-lg border border-navy-border bg-navy p-4">
                <LocationField
                  label="Pin on the map"
                  point={loc.point}
                  accuracy={loc.accuracy}
                  onChange={(next) => setLoc(next)}
                  hint="A shared GPS pin means the provider reaches you without a call round the lanes."
                />
                <div className="mt-4">
                  <PinPicker
                    point={loc.point}
                    center={areaCoord(address)}
                    emptyHint="No GPS? Tap the map at your lane or landmark and the provider starts from that pin."
                    onChange={(p) => setLoc({ point: p, accuracy: null })}
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-300">Contact number for this job</p>
                <input className={inputCls} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="The provider calls this number" inputMode="tel" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="rounded-xl border border-navy-border bg-navy p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
                  <SlidersHorizontal className="h-4 w-4" /> Filter providers
                </p>
                <div className="grid gap-2 sm:grid-cols-4">
                  <select className={inputCls} value={filters.mode} onChange={(e) => setFilters({ ...filters, mode: e.target.value })}>
                    <option value="">Any service mode</option>
                    {SERVICE_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select className={inputCls} value={filters.area} onChange={(e) => setFilters({ ...filters, area: e.target.value })}>
                    <option value="">Any area</option>
                    {DEHRADUN_AREAS.map((a) => (
                      <option key={a.name} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className={inputCls}
                    type="number"
                    placeholder="Max ₹"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  />
                  <select className={inputCls} value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
                    <option value="price">Lowest price</option>
                    <option value="jobs">Most experience</option>
                  </select>
                </div>
              </div>

              {loadingOffers && <p className="text-sm text-gray-500">Loading provider rate cards…</p>}

              {!loadingOffers && offers.length === 0 && (
                <p className="rounded-lg bg-navy p-4 text-sm text-gray-400">
                  No provider has published a rate for this service and filters yet. Clear a filter, or describe the
                  job in an emergency request and providers can reply with a quote.
                </p>
              )}

              <div className="space-y-3">
                {offers.map((o) => (
                  <button
                    key={o.ownerId}
                    onClick={() => setPick(o)}
                    className={`flex w-full flex-wrap items-center gap-3 rounded-xl border p-4 text-left transition ${
                      pick?.ownerId === o.ownerId ? "border-brand-amber bg-brand-amber/10" : "border-navy-border bg-navy hover:border-white/30"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{o.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {o.area || "Dehradun"} · {o.mode}
                        {o.etaMin ? ` · ~${o.etaMin} min by road` : ""}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {o.jobs} job{o.jobs === 1 ? "" : "s"} completed on VAHANOVA
                      </p>
                      <p className="mt-1">
                        <Stars value={o.rating?.avg || 0} count={o.rating?.count || 0} />
                      </p>
                    </div>
                    <span className="text-lg font-extrabold text-brand-amber">{o.price ? `₹${o.price}` : "On quote"}</span>
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-500">
                These prices come from each provider&rsquo;s own rate card. You deal with them directly — VAHANOVA adds
                nothing to the bill.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                  <CalendarClock className="h-4 w-4" /> Service date
                </label>
                <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-300">Time slot</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {SLOTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSlot(s)}
                      className={`rounded-lg border px-3 py-2.5 text-sm transition ${
                        slot === s ? "border-brand-amber bg-brand-amber/10 font-semibold text-brand-amber" : "border-navy-border bg-navy text-gray-300 hover:border-white/30"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-t border-navy-border pt-4 text-sm">
                <Row k="Service" v={service?.name} />
                <Row k="Provider" v={pick ? `${pick.name} · ${pick.area || "Dehradun"}` : "—"} />
                <Row k="Provider's rate" v={pick?.price ? `₹${pick.price}` : "Quote after inspection"} />
                <Row k="Vehicle" v={selectedVehicle?.number || `${vehicleType} not linked`} />
                <Row k="Address" v={address || "—"} />
                <p className="mt-4 rounded-lg bg-navy p-3 text-xs text-gray-400">
                  You pay the provider directly after the service. If parts are needed, the provider shows you the
                  cost first, and the invoice lands in your Digital Vehicle Passport.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="rounded-lg border border-navy-border px-5 py-2.5 text-sm text-gray-300 disabled:opacity-40"
            >
              Back
            </button>
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 0 && !service) ||
                  (step === 1 && (!vehicleId || (!address.trim() && !loc.point))) ||
                  (step === 2 && !pick)
                }
                className="inline-flex items-center gap-2 rounded-lg bg-brand-amber px-6 py-2.5 text-sm font-bold text-navy disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={confirm}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-amber px-6 py-2.5 text-sm font-bold text-navy"
              >
                Confirm booking <CheckCircle2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </main>
      <WhatsAppFloat />
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 py-2 last:border-0">
      <span className="text-gray-500">{k}</span>
      <span className="text-right font-medium text-gray-100">{v || "—"}</span>
    </div>
  );
}
