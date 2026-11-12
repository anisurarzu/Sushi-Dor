import { Suspense } from "react";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { CustomerAuthForm } from "@/components/auth/CustomerAuthForm";

export const metadata = {
  title: "Créer un compte · Sushi D'or",
  description:
    "Créez votre compte client pour réserver une table et commander en ligne.",
};

export default function RegisterPage() {
  return (
    <main className="bg-ink text-bone">
      <div className="relative">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 md:px-10">
          <p className="mb-1 text-[0.6rem] uppercase tracking-[0.22em] text-gold">
            Compte client
          </p>
          <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
            Créer un <span className="gold-text">compte</span>
          </h1>
          <p className="mb-8 max-w-xl text-sm text-mist">
            Un compte est requis pour réserver une table et passer commande.
            Vos réservations et commandes restent liées à votre profil.
          </p>
          <Suspense fallback={<p className="text-sm text-mist">Chargement…</p>}>
            <CustomerAuthForm mode="register" />
          </Suspense>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
