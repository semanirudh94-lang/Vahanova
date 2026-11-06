import { isPoint } from "./geo";

// Road distance, road time and the actual street path come from OpenStreetMap's OSRM
// service. Nothing here estimates a journey by drawing a line between two pins.
const ENDPOINT = "https://router.project-osrm.org/route/v1/driving";
const TIMEOUT_MS = 6000;

// The public OSRM demo asks for about one request per second per client, so every
// call in this tab goes through one queue and identical pairs are asked only once.
const cache = new Map();
let queue = Promise.resolve();

const key = (a, b) =>
  `${a[0].toFixed(3)},${a[1].toFixed(3)}>${b[0].toFixed(3)},${b[1].toFixed(3)}`;

async function fetchRoute(from, to) {
  // OSRM takes "lng,lat" and drives from the first point to the second.
  const url = `${ENDPOINT}/${Number(from[1])},${Number(from[0])};${Number(to[1])},${Number(to[0])}?overview=full&geometries=geojson`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.code === "Ok" && data.routes?.[0];
    if (!route) return null;
    return {
      points: (route.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng]),
      km: Math.round((route.distance / 1000) * 10) / 10,
      min: Math.max(1, Math.round(route.duration / 60)),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function roadRoute(from, to) {
  if (!isPoint(from) || !isPoint(to)) return Promise.resolve(null);
  const k = key(from, to);
  if (cache.has(k)) return cache.get(k);
  const pending = queue.then(() => fetchRoute(from, to), () => null);
  queue = pending.then(
    () => {},
    () => {}
  );
  cache.set(k, pending);
  return pending;
}
