import Link from "next/link";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { ReservationBookingClient } from "@/components/reservation/ReservationBookingClient";
import {
  getReservationRestaurant,
  OCCASIONS,
  toPublicRestaurant,
} from "@/lib/reservations";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Réserver une table · Sushi D'or",
  description:
    "Réservez votre table chez Sushi D'or à Annemasse — choisissez date, heure et nombre de convives.",
};

export default async function ReservationPage() {
  const restaurant = await getReservationRestaurant();

  return (
    <main className="bg-ink text-bone">
      <div className="relative">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pt-24 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-[0.6rem] uppercase tracking-[0.22em] text-gold">
                Réservation
              </p>
              <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
                Réserver une <span className="gold-text">table</span>
              </h1>
            </div>
            <Link
              href="/reservation/manage"
              className="text-xs text-gold underline underline-offset-4"
            >
              Gérer / annuler
            </Link>
          </div>

          <div className="mt-6">
            {!restaurant ? (
              <p className="border border-[color:var(--line)] p-6 text-sm text-mist">
                Les réservations en ligne sont temporairement indisponibles.
                Appelez-nous au{" "}
                <a href="tel:+33450384279" className="text-gold">
                  04 50 38 42 79
                </a>
                .
              </p>
            ) : (
              <ReservationBookingClient
                initialMeta={{
                  restaurant: toPublicRestaurant(restaurant),
                  occasions: [...OCCASIONS],
                }}
              />
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
