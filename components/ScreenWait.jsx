"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Brand from "@/components/Brand";

// Guarded screens used to render nothing at all until Firebase answered, so a slow
// or blocked request looked like a broken app. This is what they show instead.
export default function ScreenWait({ label = "Loading your account…" }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Brand markClass="h-10 w-auto" textClass="text-2xl" />
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-border border-t-brand-amber" />
      <p className="text-sm text-gray-400">{label}</p>
      {slow && (
        <div className="space-y-3">
          <p className="max-w-sm text-sm text-gray-400">
            Still waiting for your account. Check the internet connection, or sign in again.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg border border-navy-border px-4 py-2 text-sm text-gray-200 hover:border-white/30"
          >
            Go to login
          </Link>
        </div>
      )}
    </div>
  );
}
