"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Car, CalendarClock } from "lucide-react";
import { currentUser, myVehicles, addVehicle, createBooking } from "@/lib/db";
import { SERVICES, SLOTS } from "@/data/services";
import { SITE, upiLink } from "@/data/site";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const STEPS = ["Select Service", "Vehicle & Address", "Date & Time", "Confirm"];

const inputCls =
  "w-full rounded-lg border border-navy-border bg-navy px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-brand-blue";

export default function Book() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [vehicleId, setVehicleId] = useState("");
  const [newVehicle, setNewVehicle] = useState({ number: "", brand: "", model: "", year: "" });
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState(SLOTS[0]);
  const [done, setDone] = useState(null);

  useEffect(() => {
    (async () => {
      setUser(await currentUser());
      setVehicles(await myVehicles());
      setReady(true);
    })();
  }, []);

  async function saveNewVehicle() {
    if (!newVehicle.number || !newVehicle.brand) return;
    const v = await addVehicle(newVehicle);
    setVehicles((prev) => [...prev, v]);
    setVehicleId(v.id);
    setNewVehicle({ number: "", brand: "", model: "", year: "" });
  }

  async function confirm() {
    const v = vehicles.find((x) => x.id === vehicleId);
    const b = await createBooking({
      kind: "service",
      service: service.name,
      vehicleId: v ? v.id : null,
      vehicleNumber: v ? v.number : "",
      address,
      date: date || new Date().toISOString().slice(0, 10),
      slot,
      amount: service.price,
    });
    setDone(b);
  }

  if (!ready) return null;

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Booking ke liye login chahiye</h1>
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
          <h1 className="mt-4 text-2xl font-bold">Booking request bhej di gayi</h1>
          <p className="mt-2 text-sm text-gray-400">
            Booking ID <span className="font-semibold text-white">{done.code}</span> — mechanic
            accept karega to status dashboard pe update ho jayega.
          </p>
          <div className="mt-6 space-y-2 rounded-xl bg-navy p-5 text-left text-sm">
            <Row k="Service" v={done.service} />
            <Row k="Vehicle" v={done.vehicleNumber || "—"} />
            <Row k="Date" v={`${done.date} · ${done.slot}`} />
            <Row k="Address" v={done.address || "—"} />
            <Row k="Base price" v={done.amount ? `₹${done.amount}` : "Quote after inspection"} />
            <Row k="UPI ID" v={SITE.upi} />
          </div>
          {done.amount ? (
            <a
              href={upiLink(done.amount, `VahanProof ${done.code}`)}
              className="mt-4 block rounded-lg border border-brand-amber/60 bg-brand-amber/10 px-4 py-3 text-sm font-semibold text-brand-amber"
            >
              Pay ₹{done.amount} on UPI
            </a>
          ) : null}
          <p className="mt-3 text-xs text-gray-500">
            Payment optional now — service ke baad payable. Parts lage to pehle photo + quote aayega.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={`/track?b=${done.code}`} className="rounded-lg bg-brand-amber px-6 py-3 font-semibold text-navy">
              Track live
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

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/5 bg-navy-light">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-amber text-navy">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="font-bold">VahanProof</span>
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
                  key={s.id}
                  onClick={() => setService(s)}
                  className={`rounded-xl border p-4 text-left transition ${
                    service?.id === s.id
                      ? "border-brand-amber bg-brand-amber/10"
                      : "border-navy-border bg-navy hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-sm text-brand-amber">{s.price ? `₹${s.price}` : "Free"}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{s.desc}</p>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="mb-3 text-sm font-medium text-gray-300">Apni vehicle chuno</p>
                {vehicles.length === 0 && (
                  <p className="rounded-lg bg-navy p-3 text-sm text-gray-400">
                    Abhi koi vehicle nahi — niche add karo.
                  </p>
                )}
                <div className="space-y-2">
                  {vehicles.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVehicleId(v.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                        vehicleId === v.id ? "border-brand-amber bg-brand-amber/10" : "border-navy-border bg-navy hover:border-white/30"
                      }`}
                    >
                      <Car className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">{v.number}</span>
                      <span className="text-sm text-gray-500">
                        {v.brand} {v.model}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-navy-border p-4">
                <p className="mb-3 text-sm font-medium text-gray-300">Nayi vehicle add karo</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={inputCls} placeholder="Vehicle number (UK07AB1234)" value={newVehicle.number} onChange={(e) => setNewVehicle({ ...newVehicle, number: e.target.value })} />
                  <input className={inputCls} placeholder="Brand (Honda)" value={newVehicle.brand} onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })} />
                  <input className={inputCls} placeholder="Model (Activa 6G)" value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} />
                  <input className={inputCls} placeholder="Year (2021)" value={newVehicle.year} onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })} />
                </div>
                <button onClick={saveNewVehicle} className="mt-3 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white">
                  Add vehicle
                </button>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-300">Pickup / service address</p>
                <textarea className={inputCls} rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Flat / shop, area, landmark — Dehradun" />
              </div>
            </div>
          )}

          {step === 2 && (
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
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2 text-sm">
              <Row k="Service" v={service?.name} />
              <Row k="Base price" v={service?.price ? `₹${service.price}` : "Quote after inspection"} />
              <Row k="Vehicle" v={vehicles.find((x) => x.id === vehicleId)?.number || "—"} />
              <Row k="Date" v={`${date || "today"} · ${slot}`} />
              <Row k="Address" v={address || "—"} />
              <p className="mt-4 rounded-lg bg-navy p-3 text-xs text-gray-400">
                Payment service ke baad — UPI link ya mechanic ko direct. Parts lage to pehle photo +
                quote aayega, approval ke baad hi kaam hoga.
              </p>
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
                disabled={(step === 0 && !service) || (step === 1 && !vehicleId)}
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
