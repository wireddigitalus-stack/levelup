import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import { AppProvider } from "@/context/AppContext";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import SpotterFAB from "@/components/spotter/SpotterFAB";


export const metadata: Metadata = {
  title: "SubsonicDNA",
  description: "ELR Rimfire Lot Testing & Performance Tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SubsonicDNA",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-black text-white pb-24">
        <AppProvider>
          {children}
          <SpotterFAB />
          <BottomNav />
        </AppProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}

