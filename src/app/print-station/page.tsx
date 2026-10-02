import type { Metadata, Viewport } from "next";
import { PrintStationClient } from "@/components/print/PrintStationClient";

export const metadata: Metadata = {
  title: "Station d'impression · Sushi D'or",
  description: "Imprimez les tickets des commandes payées depuis iPhone (AirPrint).",
  appleWebApp: {
    capable: true,
    title: "Sushi Print",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0a08",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function PrintStationPage() {
  return <PrintStationClient />;
}
