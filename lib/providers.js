// Pure helpers over provider rate cards, shared by the local and Firestore stores so both
// return identical shapes. VAHANOVA never sets a price — these only read what the provider published.
import { isPoint, providerPoint } from "./geo";
import { roadRoute } from "./route";

export function rateOf(profile, serviceKey) {
  if (!profile || !serviceKey) return null;
  return (profile.services || []).find((s) => s.key === serviceKey) || null;
}

// Turns raw ratings into { providerId: { avg, count } }. A provider with no ratings
// gets count 0 so the UI can say "Not rated yet" instead of inventing a score.
export function averagesByProvider(ratings = []) {
  const acc = {};
  for (const r of ratings) {
    if (!r?.providerId || !(Number(r.stars) > 0)) continue;
    const bucket = acc[r.providerId] || (acc[r.providerId] = { sum: 0, count: 0 });
    bucket.sum += Number(r.stars);
    bucket.count += 1;
  }
  return Object.entries(acc).map(([providerId, v]) => [
    providerId,
    { avg: Math.round((v.sum / v.count) * 10) / 10, count: v.count },
  ]);
}

export function toOffer(profile) {
  const coord = providerPoint(profile);
  return {
    ownerId: profile.ownerId,
    name: profile.name,
    area: profile.area,
    vehicleTypes: profile.vehicleTypes || [],
    jobs: profile.jobs || 0,
    rating: profile.rating || { avg: 0, count: 0 },
    upi: profile.upi || "",
    coord,
    etaMin: null,
    profile,
  };
}

// Arrival time is the road journey from the provider's own pin to the customer's pin.
// Without either pin there is nothing to measure, so the offer simply shows no time.
export async function withRoadTimes(offers, serviceKey, jobPin) {
  for (const o of offers) {
    const rate = rateOf(o.profile, serviceKey);
    o.serviceKey = serviceKey || "";
    o.price = rate ? Number(rate.price) || 0 : 0;
    o.mode = rate ? rate.mode : "";
    if (jobPin && o.coord && rate && rate.mode === "Doorstep") {
      const route = await roadRoute(o.coord, jobPin);
      if (route) o.etaMin = route.min;
    }
  }
  return offers;
}

export async function matchOffers(profiles, opts = {}) {
  const { serviceKey, vehicleType, mode, area, maxPrice, point, sort = "price" } = opts;
  const q = (area || "").toLowerCase();
  const jobPin = isPoint(point) ? point : null;

  const offers = profiles
    .filter((p) => p.active !== false)
    .filter((p) => !vehicleType || (p.vehicleTypes || []).includes(vehicleType))
    .filter((p) => !q || (p.area || "").toLowerCase().includes(q))
    .filter((p) => !serviceKey || rateOf(p, serviceKey))
    .map((p) => toOffer(p));

  await withRoadTimes(offers, serviceKey, jobPin);

  const usable = offers.filter((o) => !mode || o.mode === mode).filter((o) => !maxPrice || !o.price || o.price <= Number(maxPrice));

  const price = (o) => (o.price > 0 ? o.price : Number.MAX_SAFE_INTEGER);
  if (sort === "jobs") usable.sort((a, b) => b.jobs - a.jobs || price(a) - price(b));
  else if (sort === "eta") usable.sort((a, b) => (a.etaMin ?? 999) - (b.etaMin ?? 999) || price(a) - price(b));
  else usable.sort((a, b) => price(a) - price(b) || b.jobs - a.jobs);

  return usable;
}
