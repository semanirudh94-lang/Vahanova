"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { rateBooking } from "@/lib/db";
import Stars, { StarPicker } from "@/components/Stars";

const LABELS = { 1: "Poor", 2: "Below average", 3: "Okay", 4: "Good", 5: "Excellent" };

// The customer's own review of a finished job. One per booking, and it cannot be
// rewritten afterwards — that is what makes the provider's score mean something.
export default function RateJob({ booking, existing, onDone }) {
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (existing) {
    return (
      <div className="rounded-lg bg-navy-lighter p-3">
        <Stars value={existing.stars} count={1} />
        {existing.comment && <p className="mt-1.5 text-xs italic text-gray-400">&ldquo;{existing.comment}&rdquo;</p>}
        <p className="mt-1 text-[11px] text-gray-500">Your review is on {booking.mechanicName || "the provider"}&rsquo;s listing.</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-navy-border px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:border-brand-amber/50 hover:text-white"
      >
        Rate this job
      </button>
    );
  }

  async function submit() {
    if (!stars) {
      setError("Choose a star rating first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const saved = await rateBooking({ bookingId: booking.id, stars, comment });
      if (!saved) {
        setError("This job is not linked to your account, so it cannot be rated.");
        return;
      }
      onDone?.(saved);
    } catch {
      setError("Could not save the review. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg bg-navy-lighter p-3">
      <p className="text-xs font-medium text-gray-300">How was {booking.mechanicName || "the provider"}?</p>
      <StarPicker value={stars} onChange={setStars} disabled={busy} />
      {stars > 0 && <p className="text-[11px] text-brand-amber">{LABELS[stars]}</p>}
      <textarea
        className="w-full rounded-lg border border-navy-border bg-navy px-3 py-2 text-xs text-white outline-none placeholder:text-gray-600 focus:border-brand-blue"
        rows={2}
        maxLength={200}
        placeholder="Optional: what went well or what to fix (200 characters)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-amber px-4 py-2 text-xs font-bold text-navy disabled:opacity-60"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Submit review
        </button>
        <button onClick={() => setOpen(false)} className="rounded-lg border border-navy-border px-3 py-2 text-xs text-gray-400 hover:text-white">
          Cancel
        </button>
      </div>
    </div>
  );
}
