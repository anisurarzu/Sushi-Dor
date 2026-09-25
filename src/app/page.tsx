import { CartePreview } from "@/components/home/CartePreview";
import { Hero } from "@/components/home/Hero";
import { OrderCta } from "@/components/home/OrderCta";
import { Restaurants } from "@/components/home/Restaurants";
import { Signature } from "@/components/home/Signature";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="bg-ink text-bone">
      <SiteHeader />
      <Hero />
      <CartePreview />
      <Signature />
      <Restaurants />
      <OrderCta />
      <SiteFooter />
    </main>
  );
}
