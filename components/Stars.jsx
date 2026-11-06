"use client";

import { Star } from "lucide-react";

// A provider shows a score only when real customers have left one.
export default function Stars({ value = 0, count = 0, size = "h-3.5 w-3.5" }) {
  if (!count) return <span className="text-xs text-gray-500">Not rated yet</span>;
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-300">
      <span className="inline-flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={`${size} ${i <= rounded ? "fill-brand-amber text-brand-amber" : "text-gray-600"}`} />
        ))}
      </span>
      <span className="font-semibold">{Number(value).toFixed(1)}</span>
      <span className="text-gray-500">
        ({count} review{count === 1 ? "" : "s"})
      </span>
    </span>
  );
}

export function StarPicker({ value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={`rounded p-1 transition disabled:opacity-50 ${n <= value ? "text-brand-amber" : "text-gray-600 hover:text-gray-400"}`}
        >
          <Star className={`h-6 w-6 ${n <= value ? "fill-brand-amber" : ""}`} />
        </button>
      ))}
    </div>
  );
}
