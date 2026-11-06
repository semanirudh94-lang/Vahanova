"use client";

import { Crosshair, Loader2, MapPin, RefreshCw, X } from "lucide-react";
import useLocation from "@/lib/useLocation";

// One control for "where is this job": a GPS capture that fills the point, plus the
// honest state when the browser refuses or cannot get a fix.
export default function LocationField({ label = "Location", point, accuracy, onChange, hint }) {
  const { status, message, locate, reset } = useLocation();
  const has = Array.isArray(point) && point.length === 2;

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-300">{label}</p>

      {has ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-green-400" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-green-300">
              Location captured{accuracy ? ` · accurate to about ${accuracy} m` : ""}
            </p>
            <p className="text-[11px] text-gray-400">
              {point[0]}, {point[1]} — your provider sees this pin, not your live position
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => locate((p, a) => onChange({ point: p, accuracy: a }))}
              className="inline-flex items-center gap-1 rounded-lg border border-navy-border px-2.5 py-1.5 text-[11px] text-gray-300 hover:border-white/30"
            >
              <RefreshCw className="h-3 w-3" /> Re-capture
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                onChange({ point: null, accuracy: null });
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-navy-border px-2.5 py-1.5 text-[11px] text-gray-400 hover:text-white"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => locate((p, a) => onChange({ point: p, accuracy: a }))}
          disabled={status === "locating"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-navy-border bg-navy px-4 py-3 text-sm font-medium text-gray-200 transition hover:border-brand-blue disabled:opacity-60 sm:w-auto"
        >
          {status === "locating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
          {status === "locating" ? "Getting your location…" : "Use my current location"}
        </button>
      )}

      {message && <p className="mt-2 text-xs text-brand-amber">{message}</p>}
      {!has && !message && <p className="mt-2 text-xs text-gray-500">{hint || "Optional but much faster for the provider. You can still type the address below."}</p>}
    </div>
  );
}
