import Link from "next/link";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { ReservationConfirmationClient } from "@/components/reservation/ReservationConfirmationClient";

export const metadata = {
  title: "Confirmation · Réservation · Sushi D'or",
};

type Props = { searchParams: Promise<{ code?: string }> };

export default async function ReservationConfirmationPage({
  searchParams,
}: Props) {
  const { code } = await searchParams;
  const confirmationCode = (code || "").trim().toUpperCase();

  return (
    <main className="bg-ink text-bone">
      <div className="relative">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32 md:px-10">
          <p className="mb-2 text-[0.65rem] uppercase tracking-[0.24em] text-gold">
            Confirmation
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl">
            Merci pour votre <span className="gold-text">réservation</span>
          </h1>
          <div className="mt-10">
            {confirmationCode ? (
              <ReservationConfirmationClient code={confirmationCode} />
            ) : (
              <div className="space-y-4">
                <p className="text-mist">
                  Code de confirmation manquant.
                </p>
                <Link href="/reservation/manage" className="btn-gold inline-flex">
                  Retrouver ma réservation
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
