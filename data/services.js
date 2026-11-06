// Service catalogue. Deliberately price-free — each service provider publishes their own
// rate in their rate card, and the customer compares those rates before booking.
export const SERVICES = [
  { key: "general", name: "General Service", desc: "Engine check, oil change, all adjustments" },
  { key: "oil", name: "Oil Change", desc: "Drain + refill + filter clean" },
  { key: "brake", name: "Brake Service", desc: "Shoes check, adjust, drum clean" },
  { key: "battery", name: "Battery Check", desc: "Terminals, voltage, charging system" },
  { key: "tyre", name: "Tyre & Puncture", desc: "Repair, pressure, wear check" },
  { key: "chain", name: "Chain & Sprocket", desc: "Clean, lube, slack adjust" },
  { key: "safety", name: "Full Safety Check", desc: "25-point inspection" },
  { key: "other", name: "Other / Repair", desc: "Describe the problem, the provider quotes after inspection" },
];

export const SERVICE_BY_KEY = Object.fromEntries(SERVICES.map((s) => [s.key, s]));

export const VEHICLE_TYPES = ["Bike", "Scooter", "Car"];

export const SERVICE_MODES = ["Doorstep", "Pickup & drop", "Garage visit"];

export const SLOTS = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "16:00 - 18:00", "18:00 - 20:00"];

export const STATUS_LABEL = {
  pending: "Pending",
  assigned: "Provider accepted",
  on_way: "On the way",
  in_progress: "Service in progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_TINT = {
  pending: "bg-brand-amber/10 text-brand-amber",
  assigned: "bg-brand-blue/10 text-blue-300",
  on_way: "bg-brand-blue/10 text-blue-300",
  in_progress: "bg-purple-500/10 text-purple-300",
  completed: "bg-green-500/10 text-green-400",
  cancelled: "bg-red-500/10 text-red-400",
};
