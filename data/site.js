export const SITE = {
  name: "VahanProof",
  tagline: "Your Vehicle, Our Responsibility",
  whatsapp: "919068511310",
  phoneDisplay: "+91 90685 11310",
  email: "semanirudh@gmail.com",
  city: "Dehradun",
  upi: "semanirudh94@oksbi",
  payeeName: "VahanProof",
};

export const WA_LINK = `https://wa.me/${SITE.whatsapp}`;

export function upiLink(amount, note) {
  const params = new URLSearchParams({ pa: SITE.upi, pn: SITE.payeeName, cu: "INR" });
  if (amount) params.set("am", String(amount));
  if (note) params.set("tn", note);
  return `upi://pay?${params.toString()}`;
}

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
