import Link from "next/link";
import {
  ShieldCheck,
  Siren,
  Wrench,
  Package,
  Fingerprint,
  Car,
  Bike,
  Truck,
  Users,
  LifeBuoy,
  CheckCircle2,
  ChevronRight,
  Star,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { SITE, WA_LINK, RATES, SURVEY_STATS } from "@/data/site";

const FEATURES = [
  {
    icon: Siren,
    title: "Emergency Assistance",
    desc: "Fuel · Towing · Battery — on-road help, one tap away",
  },
  {
    icon: Wrench,
    title: "Doorstep Servicing",
    desc: "Home pickup-drop, or a verified mechanic at your location",
  },
  {
    icon: Package,
    title: "Genuine Parts",
    desc: "Bill + photo of every replaced part. Old part always returned",
  },
  {
    icon: Fingerprint,
    title: "Digital Vehicle Passport",
    desc: "Every service recorded — raises your resale value",
  },
];

const VEHICLE_TYPES = [
  { icon: Car, label: "Car" },
  { icon: Bike, label: "Bike" },
  { icon: Bike, label: "Scooter" },
  { icon: Truck, label: "Truck" },
  { icon: Users, label: "Fleet" },
];

const STEPS = [
  {
    title: "Book on WhatsApp",
    desc: "Form bharo ya seedha WhatsApp karo — booking confirm in 2 minutes",
  },
  {
    title: "Pickup ya Doorstep",
    desc: "Ghar se pickup-drop, ya mechanic seedha aapke location pe",
  },
  {
    title: "Proof ke saath Delivery",
    desc: "Photo + bill WhatsApp pe, record hamesha aapke passport me",
  },
];

const RATE_NOTE = "Rate wahi jo garage me dete ho — warranty + proof hum free me dete hain";

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-brand-blue/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-40 top-64 h-72 w-72 rounded-full bg-brand-amber/10 blur-3xl" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Your Vehicle,
                <br />
                <span className="text-brand-amber">Our Responsibility</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-gray-400">
                Fixed-rate service, verified mechanics, 30-day written warranty
                and proof of every part — all in one place, in {SITE.city}.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-amber px-6 py-3 font-semibold text-navy transition hover:brightness-110"
                >
                  <Wrench className="h-5 w-5" />
                  Book a Service
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-lg border border-navy-border px-6 py-3 font-medium text-gray-200 transition hover:border-white/30"
                >
                  Login / Sign Up
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-300">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-amber" /> Fixed rates
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-amber" /> 30-day written warranty
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-amber" /> Photo + bill proof
                </span>
              </div>
            </div>

            {/* Vehicle Passport preview card */}
            <div className="rounded-2xl border border-navy-border bg-navy-light p-6 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Digital Vehicle Passport</p>
                  <p className="mt-1 text-xl font-bold">UK 07 AB 1234</p>
                  <p className="text-sm text-gray-400">Maruti Swift</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Warranty active
                </span>
              </div>
              <div className="mt-5 space-y-3 border-t border-white/5 pt-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Last service</span>
                  <span>General Service — 12 Sep 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Parts replaced</span>
                  <span>Engine Oil · Oil Filter (bill attached)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Next service due</span>
                  <span className="text-brand-amber">in 2 months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Insurance renewal</span>
                  <span className="inline-flex items-center gap-1 text-green-400">
                    <CheckCircle2 className="h-4 w-4" /> Done — 5 Aug 2026
                  </span>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <span className="rounded-md bg-navy-lighter px-2.5 py-1 text-xs text-gray-300">
                  Photo proof
                </span>
                <span className="rounded-md bg-navy-lighter px-2.5 py-1 text-xs text-gray-300">
                  Bill attached
                </span>
                <span className="rounded-md bg-navy-lighter px-2.5 py-1 text-xs text-gray-300">
                  Verified mechanic
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section id="services" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-navy-border bg-navy-light p-6 transition hover:border-brand-blue/50"
              >
                <f.icon className="h-7 w-7 text-brand-blue" />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-gray-400">
            {VEHICLE_TYPES.map((v) => (
              <div key={v.label} className="flex flex-col items-center gap-1.5">
                <v.icon className="h-7 w-7" />
                <span className="text-xs">{v.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Trust strip — survey proof */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="rounded-2xl border border-brand-blue/30 bg-brand-blue/10 p-8 sm:p-10">
            <div className="grid gap-8 sm:grid-cols-3">
              {SURVEY_STATS.map((s) => (
                <div key={s.label}>
                  <p className="text-4xl font-extrabold text-brand-amber">{s.value}</p>
                  <p className="mt-2 text-sm text-gray-300">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 border-t border-white/10 pt-6 text-sm italic text-gray-300">
              &ldquo;Jungle me fuel khatam, puncture — koi call karne wala nahi
              mila.&rdquo; — a rider from our {SITE.city} survey
            </p>
          </div>
        </section>

        {/* Rate card */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">Fixed Rate Card</h2>
          <p className="mt-2 text-sm text-gray-400">{RATE_NOTE}</p>
          <div className="mt-6 overflow-hidden rounded-xl border border-navy-border">
            {RATES.map((r, i) => (
              <div
                key={r.name}
                className={`flex items-center justify-between px-5 py-4 ${
                  i % 2 === 0 ? "bg-navy-light" : "bg-navy"
                }`}
              >
                <span className="text-sm text-gray-200 sm:text-base">{r.name}</span>
                <span className="font-semibold text-brand-amber">{r.price}</span>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-xl border border-navy-border bg-navy-light p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-amber font-bold text-navy">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Vehicle Passport */}
        <section id="passport" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid items-center gap-10 rounded-2xl border border-navy-border bg-navy-light p-8 sm:p-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-amber/10 px-3 py-1 text-xs font-medium text-brand-amber">
                <Fingerprint className="h-3.5 w-3.5" /> VahanProof Exclusive
              </span>
              <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
                Har service ka Digital Vehicle Passport
              </h2>
              <ul className="mt-5 space-y-3 text-sm text-gray-300">
                <li className="flex gap-2.5">
                  <Star className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
                  Bike bechte time buyer ko dikhao — resale value badhti hai
                </li>
                <li className="flex gap-2.5">
                  <Star className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
                  30-din warranty claim passport ke record se hota hai
                </li>
                <li className="flex gap-2.5">
                  <Star className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
                  Insurance, PUC, service-due reminders — kabhi date miss nahi
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/5 bg-navy p-6 text-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Passport Timeline</p>
              <div className="mt-4 space-y-4">
                {[
                  { d: "14 Sep 2026", t: "General Service", a: "₹1,499 · Invoice + photos" },
                  { d: "10 Dec 2026", t: "Brake Service", a: "₹1,300 · Old pads returned" },
                  { d: "15 Aug 2027", t: "Periodic Service", a: "Reminder scheduled" },
                ].map((e) => (
                  <div key={e.d} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-blue" />
                    <div>
                      <p className="font-medium">{e.t}</p>
                      <p className="text-xs text-gray-400">
                        {e.d} — {e.a}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* For Fleets */}
        <section id="fleets" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="rounded-2xl border border-brand-amber/30 bg-gradient-to-br from-navy-light to-navy p-8 sm:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">
                  For Fleets &amp; Dark Stores
                </h2>
                <p className="mt-3 text-sm text-gray-400">
                  Blinkit, Zepto, Zomato hubs — ya rental fleets. Riders ki bike
                  Sunday batch me service hoti hai, store pe hi.
                </p>
                <ul className="mt-5 space-y-3 text-sm text-gray-200">
                  <li className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
                    ₹399/vehicle/month — ek hi monthly bill
                  </li>
                  <li className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
                    Zero lost earning time — rider ka shift nahi rukta
                  </li>
                  <li className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
                    Free 5-minute check-up har rider ki bike ka, har hafte
                  </li>
                </ul>
              </div>
              <div className="flex flex-col items-start gap-4 lg:items-end">
                <div className="rounded-xl border border-white/5 bg-navy px-6 py-5">
                  <p className="text-sm text-gray-400">Example — 50 riders</p>
                  <p className="mt-1 text-3xl font-extrabold text-brand-amber">₹19,950<span className="text-base font-medium text-gray-400">/month</span></p>
                  <p className="mt-1 text-xs text-gray-500">One invoice. Zero downtime.</p>
                </div>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-amber px-6 py-3 font-semibold text-navy transition hover:brightness-110"
                >
                  Talk to us <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Mechanic Partner */}
        <section id="mechanics" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Mechanic Partner</h2>
              <p className="mt-3 text-sm text-gray-400">
                Apni dukaan ko online lao — booking hum laate hain, kaam aapka.
              </p>
              <ul className="mt-5 space-y-3 text-sm text-gray-200">
                <li className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                  Customers hum laate hain — marketing aapke naam-photo ke saath
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                  Rate wahi jo aap bolte ho — hum kam nahi karwate
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                  Payment UPI se seedha aapke account me
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                  Verified badge + regular batches, bas ek condition — no poaching
                </li>
              </ul>
              <Link
                href="/login"
                className="mt-7 inline-flex items-center gap-2 rounded-lg border border-brand-blue bg-brand-blue/10 px-6 py-3 font-semibold text-white transition hover:bg-brand-blue/20"
              >
                <Wrench className="h-5 w-5" /> Join as a Partner
              </Link>
            </div>
            <div className="rounded-xl border border-navy-border bg-navy-light p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy">
                  <Wrench className="h-6 w-6 text-brand-amber" />
                </div>
                <div>
                  <p className="font-semibold">Rohit Kumar</p>
                  <p className="text-sm text-gray-400">Verified Mechanic — {SITE.city}</p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-navy p-3">
                  <p className="text-lg font-bold">120+</p>
                  <p className="text-xs text-gray-400">Jobs done</p>
                </div>
                <div className="rounded-lg bg-navy p-3">
                  <p className="text-lg font-bold">4.8</p>
                  <p className="text-xs text-gray-400">Rating</p>
                </div>
                <div className="rounded-lg bg-navy p-3">
                  <p className="text-lg font-bold">30d</p>
                  <p className="text-xs text-gray-400">Warranty</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Photo, name and record — har partner ki public profile site pe.
              </p>
            </div>
          </div>
        </section>

        {/* Emergency band */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center sm:p-12">
            <LifeBuoy className="h-10 w-10 text-red-400" />
            <h2 className="text-2xl font-bold sm:text-3xl">
              Need immediate help right now?
            </h2>
            <p className="max-w-xl text-sm text-gray-300">
              Fuel khatam, puncture, battery dead — ek message karo, mechanic
              assign hota hai. {SITE.city} ke andar.
            </p>
            <Link
              href="/emergency"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-amber px-8 py-3.5 text-lg font-bold text-navy transition hover:brightness-110"
            >
              <Siren className="h-5 w-5" /> Get Emergency Help
            </Link>
            <div className="grid max-w-2xl gap-3 text-left text-sm text-gray-300 sm:grid-cols-3">
              <div className="rounded-lg bg-navy/60 p-3">
                <span className="font-semibold text-brand-amber">1.</span> Site pe form bharo — problem + location, bas
              </div>
              <div className="rounded-lg bg-navy/60 p-3">
                <span className="font-semibold text-brand-amber">2.</span> Nearest verified mechanic assign hota hai — aam tor pe 15-30 min
              </div>
              <div className="rounded-lg bg-navy/60 p-3">
                <span className="font-semibold text-brand-amber">3.</span> Kaam khatam — photo + bill aapke Vehicle Passport me
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-10 text-center sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-amber text-navy">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="font-bold">VahanProof</span>
          </div>
          <p className="text-sm text-gray-500">
            {SITE.tagline} · Made in {SITE.city}
          </p>
          <p className="text-xs text-gray-600">
            {SITE.phoneDisplay} · {SITE.email}
          </p>
        </div>
      </footer>

      <WhatsAppFloat />
    </>
  );
}
