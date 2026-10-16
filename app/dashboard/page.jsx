import Link from "next/link";
import {
  ShieldCheck,
  LayoutDashboard,
  Car,
  Wrench,
  Siren,
  FileText,
  History,
  ShoppingCart,
  User,
  LogOut,
  Bell,
  Plus,
  ChevronRight,
  Fuel,
  ShieldCheck as InsuranceIcon,
  CalendarClock,
} from "lucide-react";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { EMERGENCY_WA } from "@/data/site";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Car, label: "My Vehicles", active: false },
  { icon: Wrench, label: "Book Service", active: false },
  { icon: Siren, label: "Emergency Help", active: false },
  { icon: FileText, label: "Documents", active: false },
  { icon: History, label: "Service History", active: false },
  { icon: ShoppingCart, label: "Buy Parts", active: false },
  { icon: User, label: "Profile", active: false },
];

const QUICK_SERVICES = [
  { icon: Wrench, title: "Book Your Service", desc: "Repair / General" },
  { icon: Fuel, title: "Emergency Help", desc: "Fuel · Towing · Battery" },
  { icon: InsuranceIcon, title: "Insurance", desc: "Renewal / Claim" },
  { icon: FileText, title: "Your Documents", desc: "RC · Insurance · PUC" },
  { icon: History, title: "Service History", desc: "All past records" },
  { icon: ShoppingCart, title: "Buy Parts", desc: "Genuine & trusted" },
];

const ACTIVITY = [
  {
    icon: ShieldCheck,
    tint: "text-green-400 bg-green-500/10",
    title: "Service completed",
    desc: "General Service — 12 Sep 2026",
  },
  {
    icon: InsuranceIcon,
    tint: "text-brand-blue bg-brand-blue/10",
    title: "Insurance renewed",
    desc: "5 Aug 2026",
  },
  {
    icon: CalendarClock,
    tint: "text-brand-amber bg-brand-amber/10",
    title: "Next service due",
    desc: "in 2 months",
  },
];

export default function Dashboard() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/5 bg-navy-light md:flex">
        <Link href="/" className="flex items-center gap-2 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-amber text-navy">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold">VahanProof</span>
        </Link>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((n) => (
            <a
              key={n.label}
              href="#"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                n.active
                  ? "border-l-2 border-brand-amber bg-brand-blue/10 font-medium text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              }`}
            >
              <n.icon className="h-4.5 w-4.5" />
              {n.label}
            </a>
          ))}
        </nav>
        <div className="border-t border-white/5 p-3">
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200"
          >
            <LogOut className="h-4.5 w-4.5" />
            Logout
          </a>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-64">
        {/* Mobile brand bar */}
        <div className="flex items-center gap-2 border-b border-white/5 bg-navy-light px-4 py-3 md:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-amber text-navy">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span className="font-bold">VahanProof</span>
        </div>

        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-navy/85 px-4 py-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-lg font-bold">Good Morning, Piyush</p>
            <p className="text-xs text-gray-500">
              Keep your vehicle in the best shape
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative rounded-lg border border-navy-border p-2 text-gray-300"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-amber text-[10px] font-bold text-navy">
                2
              </span>
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue text-sm font-bold">
              PS
            </div>
          </div>
        </header>

        <main className="space-y-6 p-4 sm:p-6">
          {/* Emergency + Vehicles row */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-xl border border-navy-border bg-navy-light p-6 lg:col-span-2">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-amber/10 blur-2xl" />
              <p className="text-lg font-semibold">Need Immediate Help?</p>
              <p className="mt-1 text-sm text-gray-400">
                Emergency fuel, towing, battery and more — one tap.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={EMERGENCY_WA}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-amber px-5 py-2.5 text-sm font-bold text-navy transition hover:brightness-110"
                >
                  <Siren className="h-4 w-4" /> Get Help Now
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-navy-border bg-navy-light p-6">
              <div className="flex items-center justify-between">
                <p className="font-semibold">My Vehicles</p>
                <button className="inline-flex items-center gap-1 rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white">
                  <Plus className="h-3.5 w-3.5" /> Add Vehicle
                </button>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-navy p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-lighter">
                  <Car className="h-5 w-5 text-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-medium">UK 07 AB 1234</p>
                  <p className="text-xs text-gray-500">Maruti Swift</p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-[11px] font-medium text-green-400">
                  <ShieldCheck className="h-3 w-3" /> Warranty
                </span>
              </div>
            </div>
          </div>

          {/* Quick services */}
          <div className="rounded-xl border border-navy-border bg-navy-light p-6">
            <p className="font-semibold">Quick Services</p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {QUICK_SERVICES.map((q) => (
                <a
                  key={q.title}
                  href="#"
                  className="group rounded-lg border border-white/5 bg-navy p-4 text-center transition hover:border-brand-blue/50"
                >
                  <q.icon className="mx-auto h-6 w-6 text-brand-blue" />
                  <p className="mt-3 text-sm font-medium">{q.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{q.desc}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-xl border border-navy-border bg-navy-light p-6">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Recent Activity</p>
              <a
                href="#"
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white"
              >
                View All <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="mt-4 space-y-3">
              {ACTIVITY.map((a) => (
                <div
                  key={a.title}
                  className="flex items-center gap-3 rounded-lg bg-navy p-3.5"
                >
                  <span className={`rounded-full p-2 ${a.tint}`}>
                    <a.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-gray-500">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <WhatsAppFloat />
    </div>
  );
}
