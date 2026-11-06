export const CITY_CENTER = [30.3163, 78.0333];

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

export function isPoint(p) {
  return Array.isArray(p) && p.length === 2 && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1]));
}

export function areaCoord(area = "") {
  const hit = DEHRADUN_AREAS.find((a) => area.toLowerCase().includes(a.name.toLowerCase().split(" ")[0]));
  return hit ? hit.coord : CITY_CENTER;
}

// A job has a pin only when the customer shared a GPS fix or placed one on the map.
// The typed address is text for the provider to call about — it is never plotted as a point.
export function jobPoint(booking) {
  const real = isPoint(booking?.coord);
  return { point: real ? booking.coord : null, real };
}

// The provider's base is the pin they placed themselves, or nothing at all.
export function providerPoint(profile) {
  return isPoint(profile?.coord) ? profile.coord : null;
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

export function upiLink({ upi, name, amount, note }) {
  const q = new URLSearchParams({
    pa: upi,
    pn: name || "Service provider",
    tr: note || "",
  });
  if (amount > 0) q.set("am", String(amount));
  return `upi://pay?${q.toString()}`;
}
