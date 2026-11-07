import "./globals.css";
import ServiceWorker from "@/components/ServiceWorker";
import AIAssistant from "@/components/AIAssistant";

export const metadata = {
  title: "VAHANOVA — Every journey, taken care of.",
  description:
    "Doorstep and emergency vehicle service in Dehradun with photo and bill proof for every part, plus a digital vehicle passport that remembers your insurance, PUC and fitness dates. Works offline and installs like an app.",
  applicationName: "VAHANOVA",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "VAHANOVA",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#0B1220",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-navy text-white antialiased">
        {children}
        <AIAssistant />
        <ServiceWorker />
      </body>
    </html>
  );
}
