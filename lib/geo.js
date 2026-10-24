const CITY_CENTER = [30.3163, 78.0333];

export const DEHRADUN_AREAS = [
  { name: "Rajpur Road", coord: [30.305, 78.032] },
  { name: "Clock Tower", coord: [30.3104, 78.0327] },
  { name: "Ballupur", coord: [30.3154, 78.0314] },
  { name: "Mudasingh Road", coord: [30.31, 78.035] },
  { name: "ISBT", coord: [30.3204, 78.028] },
  { name: "Prem Nagar", coord: [30.323, 78.0205] },
  { name: "Kaulagarh Road", coord: [30.323, 78.0145] },
  { name: "Jakani", coord: [30.326, 78.036] },
  { name: "Vasantraj Vihar", coord: [30.299, 78.027] },
  { name: "Rajawata", coord: [30.294, 78.039] },
  { name: "Sugaura", coord: [30.343, 78.04] },
  { name: "Doon School Road", coord: [30.287, 78.04] },
];

export function areaCoord(area = "") {
  const hit = DEHRADUN_AREAS.find((a) => area.toLowerCase().includes(a.name.toLowerCase().split(" ")[0]));
  return hit ? hit.coord : CITY_CENTER;
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function addressCoord(address = "") {
  const base = areaCoord(address);
  const h = hash(address);
  // deterministic ~400m offset so the same address always lands on the same pin
  return [base[0] + ((h % 1000) / 1000 - 0.5) * 0.007, base[1] + (((h >> 10) % 1000) / 1000 - 0.5) * 0.009];
}

export function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const AVERAGE_CITY_KMPH = 17;

export function etaMinutes(from, to) {
  return Math.max(6, Math.round((distanceKm(from, to) / AVERAGE_CITY_KMPH) * 60) + 5);
}

function lerp(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// Quadratic bezier with a sideways bend, so the path looks like a road instead of a straight line.
export function buildRoute(from, to, steps = 60) {
  const mid = lerp(from, to, 0.5);
  const dx = to[1] - from[1];
  const dy = to[0] - from[0];
  const len = Math.max(Math.hypot(dy, dx), 1e-9);
  const bend = 0.16;
  const ctrl = [mid[0] + (-dx / len) * len * bend, mid[1] + (dy / len) * len * bend];
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const w0 = (1 - t) ** 2;
    const w1 = 2 * (1 - t) * t;
    const w2 = t ** 2;
    pts.push([from[0] * w0 + ctrl[0] * w1 + to[0] * w2, from[1] * w0 + ctrl[1] * w1 + to[1] * w2]);
  }
  return pts;
}

export function pointOnRoute(route, progress) {
  const p = Math.min(Math.max(progress, 0), 1);
  const idx = p * (route.length - 1);
  const i = Math.floor(idx);
  return i >= route.length - 1 ? route[route.length - 1] : lerp(route[i], route[i + 1], idx - i);
}

// Position of the mechanic right now: garage -> customer, over etaMinutes from the moment they left.
export function livePosition({ from, to, leftAt, etaMin, status }) {
  const route = buildRoute(from, to);
  const arrived = status === "in_progress" || status === "completed";
  if (arrived) return { route, at: to, progress: 1, arrived: true, minsLeft: 0 };
  const started = leftAt ? new Date(leftAt).getTime() : null;
  const elapsedMin = started ? (Date.now() - started) / 60000 : 0;
  const progress = Math.min(elapsedMin / Math.max(etaMin || 15, 1), 0.97);
  return {
    route,
    at: pointOnRoute(route, progress),
    progress,
    arrived: false,
    minsLeft: Math.max(1, Math.ceil((etaMin || 15) - elapsedMin)),
  };
}
