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
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32 md:px-10">
          <p className="mb-2 text-[0.65rem] uppercase tracking-[0.24em] text-gold">
            Réservation
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl">
            Réserver une <span className="gold-text">table</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-mist sm:text-base">
            Sélectionnez vos convives, un créneau disponible, puis confirmez.
            Les groupes de 8 personnes et plus sont validés par le restaurant.
          </p>
          <p className="mt-2 text-sm">
            <Link href="/reservation/manage" className="text-gold underline">
              Déjà une réservation ? Gérer / annuler
            </Link>
          </p>

          <div className="mt-10">
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
