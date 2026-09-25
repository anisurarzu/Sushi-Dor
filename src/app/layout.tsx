import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Sushi D'or · Annemasse & Thonon-les-Bains",
  description:
    "Sushi D'or — cuisine japonaise à Annemasse et Thonon-les-Bains (Haute-Savoie). Commande en ligne, personnalisation et paiement sécurisé.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
