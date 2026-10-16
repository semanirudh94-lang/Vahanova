export const SITE = {
  name: "VahanProof",
  tagline: "Your Vehicle, Our Responsibility",
  whatsapp: "919999999999",
  phoneDisplay: "+91 99999 99999",
  email: "hello@vahanproof.in",
  city: "Dehradun",
};

export const WA_LINK = `https://wa.me/${SITE.whatsapp}`;

export const EMERGENCY_MSG = [
  "EMERGENCY HELP",
  "Problem: (puncture / fuel / battery / towing / other)",
  "Location: (apni live location bhejo)",
  "Vehicle: (e.g. Activa 6G)",
  "Name: ",
].join("\n");

export const EMERGENCY_WA = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(EMERGENCY_MSG)}`;

export const RATES = [
  { name: "General Service — Bike", price: "₹499" },
  { name: "General Service — Scooter", price: "₹549" },
  { name: "Oil Change (labour + disposal)", price: "₹199" },
  { name: "Puncture Repair (doorstep, tubeless)", price: "₹149" },
  { name: "Battery Jumpstart", price: "₹199" },
  { name: "Full Safety Check", price: "Free with service" },
];

export const SURVEY_STATS = [
  { value: "52", label: "Dehradun riders surveyed" },
  { value: "76%", label: "couldn't find trusted help in a breakdown" },
  { value: "75%", label: "want a verified mechanic, first" },
];
