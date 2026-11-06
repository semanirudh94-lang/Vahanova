"use client";

import { useCallback, useState } from "react";

// GeolocationPositionError.code
const ERRORS = {
  1: "Location permission was blocked. Allow it for this site in your browser settings, or type your address instead.",
  2: "Your device did not give a location. Turn on GPS in your phone settings, or type your address.",
  3: "We could not get a GPS fix in time. Move to an open area and try again, or type your address.",
};

// Coordinates are stored to ~1 m precision, which is all a provider needs to reach you.
const round = (n) => Number(Number(n).toFixed(5));

export default function useLocation() {
  const [state, setState] = useState({ status: "idle", message: "", accuracy: null });

  const locate = useCallback((onDone) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "error", message: "This browser cannot share a location. Please type your address.", accuracy: null });
      return;
    }
    setState({ status: "locating", message: "", accuracy: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = [round(pos.coords.latitude), round(pos.coords.longitude)];
        const accuracy = Math.round(pos.coords.accuracy);
        setState({ status: "ok", message: "", accuracy });
        onDone?.(point, accuracy);
      },
      (err) => setState({ status: "error", message: ERRORS[err?.code] || "We could not read your location. Please type your address.", accuracy: null }),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  const reset = useCallback(() => setState({ status: "idle", message: "", accuracy: null }), []);

  return { ...state, locate, reset };
}
