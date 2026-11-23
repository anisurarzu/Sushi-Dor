import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { consumeEmailVerificationToken } from "@/lib/email-verification";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vérification e-mail · Sushi D'or",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token?.trim()) {
    redirect("/compte?verify=missing");
  }

  const result = await consumeEmailVerificationToken(token);
  if (!result.ok) {
    return (
      <main className="bg-ink text-bone">
        <div className="relative">
          <SiteHeader />
          <div className="mx-auto max-w-lg px-4 pb-20 pt-28 sm:px-6">
            <p className="mb-1 text-[0.6rem] uppercase tracking-[0.22em] text-gold">
              Compte
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl">
              Lien invalide
            </h1>
            <p className="mt-3 text-sm text-mist">{result.error}</p>
            <p className="mt-6">
              <Link href="/compte" className="btn-gold">
                Retour au compte
              </Link>
            </p>
          </div>
          <SiteFooter />
        </div>
      </main>
    );
  }

  redirect(
    result.already ? "/compte?verify=already" : "/compte?verify=ok",
  );
}
