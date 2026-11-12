import { Suspense } from "react";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { CustomerAuthForm } from "@/components/auth/CustomerAuthForm";

export const metadata = {
  title: "Connexion · Sushi D'or",
  description: "Connectez-vous pour réserver et commander chez Sushi D'or.",
};

export default function LoginPage() {
  return (
    <main className="bg-ink text-bone">
      <div className="relative">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 md:px-10">
          <p className="mb-1 text-[0.6rem] uppercase tracking-[0.22em] text-gold">
            Compte client
          </p>
          <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
            Se <span className="gold-text">connecter</span>
          </h1>
          <p className="mb-8 max-w-xl text-sm text-mist">
            Accédez à vos réservations et commandes avec votre compte client.
          </p>
          <Suspense fallback={<p className="text-sm text-mist">Chargement…</p>}>
            <CustomerAuthForm mode="login" />
          </Suspense>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
