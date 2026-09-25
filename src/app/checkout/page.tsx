import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { CheckoutForm } from "@/components/cart/CheckoutForm";

export const metadata = {
  title: "Paiement · Sushi D'or",
};

export default function CheckoutPage() {
  return (
    <main className="bg-ink text-bone">
      <div className="relative">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32 md:px-10">
          <p className="mb-2 text-[0.65rem] uppercase tracking-[0.24em] text-gold">
            Paiement sécurisé
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl">
            Finaliser <span className="gold-text">la commande</span>
          </h1>
          <div className="mt-10">
            <CheckoutForm />
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
