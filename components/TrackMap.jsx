"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const mechIcon = () =>
  L.divIcon({
    className: "",
    html: `<div class="vp-marker vp-marker--mech"><span class="vp-pulse"></span><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 17h2a2 2 0 002-2v-1l6-1 3 3h2a1 1 0 001-1v-2a3 3 0 00-3-3h-1L14 6H8a2 2 0 00-2 2v3l-2 1v5z" fill="#2563EB"/><circle cx="8" cy="17" r="2" fill="#0B1220"/><circle cx="17" cy="17" r="2" fill="#0B1220"/></svg></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

const pinIcon = (color) =>
  L.divIcon({
    className: "",
    html: `<div class="vp-marker vp-marker--pin" style="background:${color}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

export default function TrackMap({ route = [], from, to, at, showMechanic = true }) {
  const el = useRef(null);
  const g = useRef({});

  useEffect(() => {
    if (!el.current || g.current.map) return;
    const map = L.map(el.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      crossOrigin: true,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    g.current.map = map;
    return () => {
      map.remove();
      g.current = {};
    };
  }, []);

  useEffect(() => {
    const map = g.current.map;
    if (!map || !to) return;
    if (g.current.line) map.removeLayer(g.current.line);
    if (g.current.dest) map.removeLayer(g.current.dest);
    if (route.length > 1) {
      g.current.line = L.polyline(route, { color: "#F59E0B", weight: 4, opacity: 0.75, dashArray: "1,9", lineCap: "round" }).addTo(map);
    }
    g.current.dest = L.marker(to, { icon: pinIcon("#F59E0B") }).addTo(map);
    const bounds = L.latLngBounds(route.length > 1 ? route : [from, to]);
    map.fitBounds(bounds.pad(0.35));
  }, [JSON.stringify(route), JSON.stringify(to)]);

  useEffect(() => {
    const map = g.current.map;
    if (!map) return;
    if (!showMechanic || !at) {
      if (g.current.mech) {
        map.removeLayer(g.current.mech);
        g.current.mech = null;
      }
      return;
    }
    if (g.current.mech) g.current.mech.setLatLng(at);
    else g.current.mech = L.marker(at, { icon: mechIcon(), zIndexOffset: 500 }).addTo(map);
  }, [JSON.stringify(at), showMechanic]);

  return <div ref={el} className="vp-map h-72 w-full overflow-hidden rounded-2xl border border-navy-border sm:h-96" />;
}
