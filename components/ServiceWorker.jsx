"use client";

import { useEffect } from "react";
import { FB_CONFIG, firebaseOn } from "@/lib/firebase";

export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
    const timer = setTimeout(() => {
      const config = firebaseOn && FB_CONFIG.messagingSenderId
        ? `?firebaseConfig=${encodeURIComponent(JSON.stringify(FB_CONFIG))}`
        : "";
      navigator.serviceWorker.register(`/sw.js${config}`).catch((error) => {
        console.error("VAHANOVA service worker registration failed:", error);
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
