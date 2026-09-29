import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { ReservationManager } from "@/components/admin/ReservationManager";

export const dynamic = "force-dynamic";

export default async function AdminReservationsPage() {
  await requireAdmin("reservations.view");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [reservations, restaurants] = await Promise.all([
    prisma.reservation.findMany({
      where: { date: { gte: today } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 100,
      include: { restaurant: true },
    }),
    prisma.restaurant.findMany({
      where: { isActive: true, reservationEnabled: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Réservations
        </h1>
        <p className="mt-1 text-sm text-[#a89f8e]">
          Création, édition et contrôle de capacité côté serveur.
        </p>
      </div>
      <ReservationManager
        restaurants={restaurants.map((r) => ({ id: r.id, name: r.name }))}
        initial={reservations.map((r) => ({
          id: r.id,
          confirmationCode: r.confirmationCode,
          date: r.date.toISOString().slice(0, 10),
          startTime: r.startTime,
          endTime: r.endTime,
          partySize: r.partySize,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          phone: r.phone,
          specialRequest: r.specialRequest,
          status: r.status,
          restaurantId: r.restaurantId,
          restaurantName: r.restaurant.name,
        }))}
      />
    </div>
  );
}
