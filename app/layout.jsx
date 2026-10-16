import "./globals.css";

export const metadata = {
  title: "VahanProof — Your Vehicle, Our Responsibility",
  description:
    "Fixed-rate vehicle service in Dehradun with 30-day written warranty, photo + bill proof, and a Digital Vehicle Passport for every service.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-navy text-white antialiased">{children}</body>
    </html>
  );
}
