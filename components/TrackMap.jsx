"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CITY_CENTER } from "@/lib/geo";

const pin = (color) =>
  L.divIcon({
    className: "",
    html: `<div class="vp-marker vp-marker--pin" style="background:${color}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

function useLeaflet(el, onClick) {
  const g = useRef({});
  const clickRef = useRef(onClick);
  clickRef.current = onClick;

  useEffect(() => {
    if (!el.current || g.current.map) return;
    const map = L.map(el.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    map.on("click", (e) => clickRef.current?.([Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))]));
    g.current.map = map;
    // The map is often mounted while its container is still sizing, which leaves
    // grey tiles until the next pan.
    setTimeout(() => map.invalidateSize(), 200);
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      map.remove();
      g.current = {};
    };
  }, []);

  return g;
}

// Real pins, and the real streets between them when a route was fetched.
// Nothing is drawn between two points that no route was found for.
export default function TrackMap({ from, to, route, fromLabel = "Provider base", toLabel = "Your location", clickable = false, height = "h-72 sm:h-96" }) {
  const el = useRef(null);
  const g = useLeaflet(el, clickable ? (p) => g.current.onChange?.(p) : null);
  const path = route && route.length > 1 ? route : null;

  useEffect(() => {
    const map = g.current.map;
    if (!map) return;
    if (g.current.layer) map.removeLayer(g.current.layer);
    const layer = L.layerGroup().addTo(map);
    g.current.layer = layer;
    const bounds = [];
    if (to) {
      L.marker(to, { icon: pin("#F59E0B") }).bindTooltip(toLabel, { direction: "top" }).addTo(layer);
      bounds.push(to);
    }
    if (from) {
      L.marker(from, { icon: pin("#2563EB") }).bindTooltip(fromLabel, { direction: "top" }).addTo(layer);
      bounds.push(from);
    }
    if (path) {
      L.polyline(path, { color: "#F59E0B", weight: 5, opacity: 0.85 }).addTo(layer);
      bounds.push(...path);
    }
    if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds).pad(0.15));
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    }
  }, [JSON.stringify(from), JSON.stringify(to), JSON.stringify(path), fromLabel, toLabel]);

  useEffect(() => {
    if (clickable && to && g.current.map) g.current.map.setView(to, 15);
  }, [clickable]);

  return <div ref={el} className={`vp-map ${height} w-full overflow-hidden rounded-2xl border border-navy-border`} />;
}

// Click or drag to place the pin a provider or customer wants to be found at.
export function PinPicker({ point, onChange, center = CITY_CENTER, height = "h-56", emptyHint = "Tap the map where customers should find you." }) {
  const el = useRef(null);
  const g = useLeaflet(el, (p) => onChange(p));

  useEffect(() => {
    const map = g.current.map;
    if (!map) return;
    if (g.current.drag) map.removeLayer(g.current.drag);
    if (point) {
      const m = L.marker(point, { icon: pin("#2563EB"), draggable: true }).addTo(map);
      m.on("dragend", () => {
        const p = m.getLatLng();
        onChange([Number(p.lat.toFixed(5)), Number(p.lng.toFixed(5))]);
      });
      map.setView(point, 15);
      g.current.drag = m;
    } else {
      map.setView(center, 13);
    }
  }, [JSON.stringify(point)]);

  return (
    <div>
      <div ref={el} className={`vp-map ${height} w-full overflow-hidden rounded-xl border border-navy-border`} />
      <p className="mt-2 text-xs text-gray-500">
        {point ? "Drag the pin or tap another spot to move it." : emptyHint}
      </p>
    </div>
  );
}
