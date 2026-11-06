"use client";

import Link from "next/link";
import { User, Wrench } from "lucide-react";
import Brand from "@/components/Brand";
import { isLive } from "@/lib/db";

export const authInput =
  "w-full rounded-lg border border-navy-border bg-navy px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-brand-blue";

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.09-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.32-6.32C39.02 4.24 33.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}

export function RoleTabs({ role, onChange, disabled }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-navy p-1">
      {[
        { key: "customer", label: "Customer", icon: User },
        { key: "mechanic", label: "Service Provider", icon: Wrench },
      ].map((t) => (
        <button
          key={t.key}
          type="button"
          disabled={disabled}
          onClick={() => onChange(t.key)}
          className={`flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition disabled:opacity-60 ${
            role === t.key ? "bg-brand-blue text-white" : "text-gray-400"
          }`}
        >
          <t.icon className="h-4 w-4" /> {t.label}
        </button>
      ))}
    </div>
  );
}

// Both auth screens need the same frame, or their styles drift apart.
export default function AuthShell({ title, subtitle, role, onRole, google, waiting, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <Brand markClass="h-10 w-auto" textClass="text-2xl" />
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-navy-border bg-navy-light p-7">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-gray-400">{subtitle}</p>

        {waiting ? (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-navy-border bg-navy px-4 py-4 text-sm text-gray-300">
            <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-navy-border border-t-brand-amber" />
            Finishing your Google sign-in…
          </div>
        ) : (
          <>
            <RoleTabs role={role} onChange={onRole} disabled={google?.disabled} />

            {children}

            {google && isLive && (
              <>
                <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wide text-gray-500">
                  <span className="h-px flex-1 bg-navy-border" />
                  or
                  <span className="h-px flex-1 bg-navy-border" />
                </div>
                <button
                  type="button"
                  onClick={google.onClick}
                  disabled={google.disabled}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-navy-border py-3 text-sm font-medium text-gray-200 transition hover:border-white/30 disabled:opacity-60"
                >
                  <GoogleG /> {google.label}
                </button>
              </>
            )}
          </>
        )}

        {footer}

        <p className="mt-5 rounded-lg bg-brand-amber/10 px-3 py-2 text-center text-xs text-brand-amber">
          {isLive
            ? "Live mode — all bookings and service records are stored in your Firebase database."
            : "Demo mode — data is saved in this browser only."}
        </p>
      </div>
    </div>
  );
}
