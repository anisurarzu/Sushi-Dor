import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { ReservationManageClient } from "@/components/reservation/ReservationManageClient";

export const metadata = {
  title: "Gérer ma réservation · Sushi D'or",
};

type Props = {
  searchParams: Promise<{ token?: string; code?: string }>;
};

export default async function ReservationManagePage({ searchParams }: Props) {
  const { token, code } = await searchParams;

  return (
    <main className="bg-ink text-bone">
      <div className="relative">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32 md:px-10">
          <p className="mb-2 text-[0.65rem] uppercase tracking-[0.24em] text-gold">
            Réservation
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl">
            Gérer ma <span className="gold-text">réservation</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-mist">
            Consultez le détail ou annulez votre table avec votre code de
            confirmation.
          </p>
          <div className="mt-10">
            <ReservationManageClient
              initialToken={token}
              initialCode={code}
            />
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
