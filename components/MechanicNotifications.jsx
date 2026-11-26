"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import {
  enableMechanicPush,
  listenForMechanicPush,
  syncMechanicPushIfAllowed,
} from "@/lib/push-notifications";

export default function MechanicNotifications() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const stopRef = useRef(null);

  async function listen() {
    stopRef.current?.();
    stopRef.current = await listenForMechanicPush((data) => {
      if (Notification.permission !== "granted") return;
      const notification = new Notification(data.title || "New VAHANOVA request", {
        body: data.body || "A new service request is waiting.",
        icon: "/icon-192.png",
        tag: data.tag || `vahanova-request-${data.requestId || "new"}`,
      });
      notification.onclick = () => {
        window.focus();
        window.location.href = data.url || "/mechanic#requests";
      };
    });
  }

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const restored = await syncMechanicPushIfAllowed();
        if (restored && active) {
          setEnabled(true);
          await listen();
        }
      } catch (e) {
        if (active) setError(e?.message || "Could not restore notification registration.");
      }
    }
    restore();
    return () => {
      active = false;
      stopRef.current?.();
    };
  }, []);

  async function turnOn() {
    setBusy(true);
    setError("");
    try {
      await enableMechanicPush();
      await listen();
      setEnabled(true);
    } catch (e) {
      setError(e?.message || "Could not enable request alerts.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-navy-border bg-navy-light p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-brand-amber/10 p-2 text-brand-amber">
          {enabled ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </span>
        <div>
          <p className="font-semibold">New request alerts</p>
          <p className="mt-1 text-sm text-gray-400">
            {enabled
              ? "This device is registered. New open requests can alert you even when VAHANOVA is in the background."
              : "Enable phone notifications so you do not have to keep checking the Requests screen."}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={turnOn}
        disabled={busy}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-amber px-4 py-2.5 text-sm font-bold text-navy disabled:opacity-60"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {busy ? "Enabling…" : enabled ? "Refresh alerts" : "Enable alerts"}
      </button>
      {error && <p role="alert" className="text-sm text-red-400 sm:basis-full">{error}</p>}
    </section>
  );
}
