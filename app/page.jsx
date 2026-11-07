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
import Brand from "@/components/Brand";
import InstallButton from "@/components/InstallButton";
import { SITE, WA_LINK } from "@/data/site";

const FEATURES = [
  {
    icon: Siren,
    title: "Emergency Assistance",
    desc: "Fuel · Towing · Battery — send your location, the nearest available provider picks it up",
  },
  {
    icon: Wrench,
    title: "Doorstep Servicing",
    desc: "At your location, or pickup and drop — choose the mode each provider offers",
  },
  {
    icon: Package,
    title: "Clear Billing",
    desc: "Parts, labour and the provider's note written into one record after every job",
  },
  {
    icon: Fingerprint,
    title: "Digital Vehicle Passport",
    desc: "A complete service history you can show a buyer or an insurer",
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
    title: "Compare rate cards",
    desc: "Every provider publishes their own price. Filter by area, service mode and budget.",
  },
  {
    title: "Pick your provider",
    desc: "Choose the provider you want. Contact details are shared after the booking is assigned.",
  },
  {
    title: "Service and record",
    desc: "You settle the bill with the provider directly. The job is logged in your passport.",
  },
];

const PRICE_POINTS = [
  "Providers set their own rates. VAHANOVA does not fix, suggest or mark them up.",
  "No commission and no platform fee on any booking — you pay the provider, they keep it all.",
  "If parts are needed, the provider tells you the cost before the work starts.",
];

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
                Every journey,
                <br />
                <span className="text-brand-amber">taken care of.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-gray-400">
                Compare the rate cards of vehicle service providers in {SITE.city}, choose who you want, and keep
                every service on record in one Digital Vehicle Passport.
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
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg border border-navy-border px-6 py-3 font-medium text-gray-200 transition hover:border-white/30"
                >
                  Create account
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-lg border border-navy-border px-6 py-3 font-medium text-gray-200 transition hover:border-white/30"
                >
                  Sign in
                </Link>
                <InstallButton className="inline-flex items-center gap-2 rounded-lg border border-navy-border px-6 py-3 font-medium text-gray-200 transition hover:border-white/30" />
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-300">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-amber" /> Provider-set rates
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-amber" /> No commission, no fee
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-amber" /> Full service history
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
                <span className="inline-flex items-center gap-1 rounded-full bg-navy px-3 py-1 text-xs font-medium text-gray-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Example
                </span>
              </div>
              <div className="mt-5 space-y-3 border-t border-white/5 pt-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Last service</span>
                  <span>General Service</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Parts used</span>
                  <span>Engine Oil · Oil Filter</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Billed by</span>
                  <span>Your chosen provider</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Documents</span>
                  <span>Insurance · PUC · Fitness</span>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <span className="rounded-md bg-navy-lighter px-2.5 py-1 text-xs text-gray-300">
                  Invoice stored
                </span>
                <span className="rounded-md bg-navy-lighter px-2.5 py-1 text-xs text-gray-300">
                  Provider named
                </span>
                <span className="rounded-md bg-navy-lighter px-2.5 py-1 text-xs text-gray-300">
                  Reminder ready
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

        {/* How pricing works */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">How pricing works</h2>
          <p className="mt-2 text-sm text-gray-400">There is no VAHANOVA rate card. Here is the whole model.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {PRICE_POINTS.map((p, i) => (
              <div key={i} className="rounded-xl border border-navy-border bg-navy-light p-6">
                <CheckCircle2 className="h-6 w-6 text-brand-amber" />
                <p className="mt-4 text-sm text-gray-200">{p}</p>
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
                <Fingerprint className="h-3.5 w-3.5" /> {SITE.name} Exclusive
              </span>
              <h2 className="mt-4 text-2xl font-bold sm:text-3xl">A passport for every service</h2>
              <ul className="mt-5 space-y-3 text-sm text-gray-300">
                <li className="flex gap-2.5">
                  <Star className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
                  Show a buyer or an insurer exactly how the vehicle was maintained
                </li>
                <li className="flex gap-2.5">
                  <Star className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
                  Every job keeps the provider&rsquo;s name, parts used and their warranty term
                </li>
                <li className="flex gap-2.5">
                  <Star className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
                  Insurance, PUC and service dates in one place, so nothing expires quietly
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/5 bg-navy p-6 text-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Passport Timeline — example</p>
              <div className="mt-4 space-y-4">
                {[
                  { t: "General Service", a: "Invoice and parts list attached" },
                  { t: "Brake Service", a: "Parts and labour shown separately" },
                  { t: "Next service", a: "Scheduled when you set the date" },
                ].map((e, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-blue" />
                    <div>
                      <p className="font-medium">{e.t}</p>
                      <p className="text-xs text-gray-400">{e.a}</p>
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
                <h2 className="text-2xl font-bold sm:text-3xl">For Fleets &amp; Dark Stores</h2>
                <p className="mt-3 text-sm text-gray-400">
                  Delivery hubs, rental fleets, own cabs. Vehicles are serviced at your location in scheduled batches,
                  so a rider does not lose a shift waiting at a garage.
                </p>
                <ul className="mt-5 space-y-3 text-sm text-gray-200">
                  <li className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
                    One schedule for the whole fleet, serviced on site
                  </li>
                  <li className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
                    A service passport per vehicle, with the provider named on every job
                  </li>
                  <li className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
                    Pricing quoted for your fleet size — no listed rate, no platform fee
                  </li>
                </ul>
              </div>
              <div className="flex flex-col items-start gap-4 lg:items-end">
                <div className="rounded-xl border border-white/5 bg-navy px-6 py-5">
                  <p className="text-sm text-gray-400">Tell us the fleet size</p>
                  <p className="mt-1 text-2xl font-extrabold text-brand-amber">We quote in a day</p>
                  <p className="mt-1 text-xs text-gray-500">Bikes, cars or a mix — serviced at your hub.</p>
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

        {/* Service Providers */}
        <section id="mechanics" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">For Service Providers</h2>
              <p className="mt-3 text-sm text-gray-400">
                Put your shop online with your own prices. Customers in your area find you and book you.
              </p>
              <ul className="mt-5 space-y-3 text-sm text-gray-200">
                <li className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                  Publish a rate card — you set every price and which services you take
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                  No commission and no fee — at launch you keep 100% of what you bill
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                  Bookings arrive on your dashboard with the customer&rsquo;s number and address
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                  Completed jobs build your history on your public listing
                </li>
              </ul>
              <Link
                href="/signup?role=mechanic"
                className="mt-7 inline-flex items-center gap-2 rounded-lg border border-brand-blue bg-brand-blue/10 px-6 py-3 font-semibold text-white transition hover:bg-brand-blue/20"
              >
                <Wrench className="h-5 w-5" /> Join as a Provider
              </Link>
            </div>
            <div className="rounded-xl border border-navy-border bg-navy-light p-6">
              <p className="text-sm font-semibold">A provider listing looks like this</p>
              <div className="mt-4 rounded-lg border border-navy-border bg-navy p-4">
                <p className="font-semibold text-brand-amber">Your shop name</p>
                <p className="mt-1 text-xs text-gray-500">Your area · Doorstep, pickup or garage</p>
                <div className="mt-3 space-y-2 text-sm">
                  {["General Service", "Oil Change", "Brake Service"].map((s) => (
                    <div key={s} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                      <span className="text-gray-300">{s}</span>
                      <span className="text-gray-500">your price</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Customers can sort listings by price, completed jobs or arrival time — so a fair rate card gets seen.
              </p>
            </div>
          </div>
        </section>

        {/* Emergency band */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center sm:p-12">
            <LifeBuoy className="h-10 w-10 text-red-400" />
            <h2 className="text-2xl font-bold sm:text-3xl">Need immediate help right now?</h2>
            <p className="max-w-xl text-sm text-gray-300">
              Out of fuel, a puncture, a dead battery — send your location and problem. The request goes to the
              providers working in {SITE.city}, and whoever is free takes it.
            </p>
            <Link
              href="/emergency"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-amber px-8 py-3.5 text-lg font-bold text-navy transition hover:brightness-110"
            >
              <Siren className="h-5 w-5" /> Get Emergency Help
            </Link>
            <div className="grid max-w-2xl gap-3 text-left text-sm text-gray-300 sm:grid-cols-3">
              <div className="rounded-lg bg-navy/60 p-3">
                <span className="font-semibold text-brand-amber">1.</span> Send the problem and your location
              </div>
              <div className="rounded-lg bg-navy/60 p-3">
                <span className="font-semibold text-brand-amber">2.</span> A free provider accepts and calls you
              </div>
              <div className="rounded-lg bg-navy/60 p-3">
                <span className="font-semibold text-brand-amber">3.</span> See when they leave for you, then the job is
                recorded
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-10 text-center sm:px-6">
          <div className="flex items-center gap-2.5">
            <Brand markClass="h-6 w-auto" textClass="text-base" />
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
