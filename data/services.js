export const SERVICES = [
  { id: "general", name: "General Service", price: 499, desc: "Engine check, oil change, all adjustments" },
  { id: "oil", name: "Oil Change", price: 199, desc: "Drain + refill + filter clean" },
  { id: "brake", name: "Brake Service", price: 349, desc: "Shoes check, adjust, drum clean" },
  { id: "battery", name: "Battery Check", price: 149, desc: "Terminals, voltage, charging system" },
  { id: "tyre", name: "Tyre & Puncture", price: 149, desc: "Repair, pressure, wear check" },
  { id: "chain", name: "Chain & Sprocket", price: 249, desc: "Clean, lube, slack adjust" },
  { id: "safety", name: "Full Safety Check", price: 0, desc: "25-point inspection, free with service" },
  { id: "other", name: "Other / Repair", price: 0, desc: "Describe the problem, we will quote" },
];

export const SLOTS = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "16:00 - 18:00", "18:00 - 20:00"];

export const STATUS_LABEL = {
  pending: "Pending",
  assigned: "Mechanic assigned",
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
