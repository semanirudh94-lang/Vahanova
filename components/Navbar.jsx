"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Brand from "@/components/Brand";
import InstallButton from "@/components/InstallButton";

const LINKS = [
  { href: "#services", label: "Services" },
  { href: "#how", label: "How it works" },
  { href: "#passport", label: "Vehicle Passport" },
  { href: "#fleets", label: "For Fleets" },
  { href: "#mechanics", label: "For Providers" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-navy/85 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Brand />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-gray-300 transition hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <InstallButton className="flex items-center gap-1.5 rounded-lg border border-navy-border px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-white/30" />
          <Link
            href="/login"
            className="rounded-lg border border-navy-border px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-white/30"
          >
            Login
          </Link>
          <Link
            href="/book"
            className="rounded-lg bg-brand-amber px-4 py-2 text-sm font-semibold text-navy transition hover:brightness-110"
          >
            Book Service
          </Link>
        </div>

        <button
          className="text-gray-200 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/5 bg-navy px-4 pb-4 pt-2 md:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-sm text-gray-200"
            >
              {l.label}
            </a>
          ))}
          <InstallButton className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-navy-border px-4 py-2 text-sm font-medium text-gray-200" />
          <div className="mt-2 flex gap-3">
            <Link
              href="/login"
              className="flex-1 rounded-lg border border-navy-border px-4 py-2 text-center text-sm font-medium"
            >
              Login
            </Link>
            <Link
              href="/book"
              className="flex-1 rounded-lg bg-brand-amber px-4 py-2 text-center text-sm font-semibold text-navy"
            >
              Book Service
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
