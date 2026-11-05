import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { ReservationManager } from "@/components/admin/ReservationManager";

export const dynamic = "force-dynamic";

export default async function AdminReservationsPage() {
  await requireAdmin("reservations.view");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const [reservations, restaurants, todayRows, pendingCount] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        date: { gte: today },
        deletedStatus: 0,
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 200,
      include: { restaurant: true },
    }),
    prisma.restaurant.findMany({
      where: { isActive: true, reservationEnabled: true },
      orderBy: { name: "asc" },
    }),
    prisma.reservation.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
        status: { in: ["PENDING", "CONFIRMED"] },
        deletedStatus: 0,
      },
      select: { partySize: true },
    }),
    prisma.reservation.count({
      where: {
        status: "PENDING",
        date: { gte: today },
        deletedStatus: 0,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Réservations
        </h1>
        <p className="mt-1 text-sm text-[#a89f8e]">
          Planning du jour, confirmations, no-shows et réservations téléphone /
          walk-in.
        </p>
      </div>
      <ReservationManager
        restaurants={restaurants.map((r) => ({ id: r.id, name: r.name }))}
        todayCount={todayRows.length}
        todayGuestCount={todayRows.reduce((s, r) => s + r.partySize, 0)}
        pendingCount={pendingCount}
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
          occasion: r.occasion,
          specialRequest: r.specialRequest,
          adminNotes: r.adminNotes,
          status: r.status,
          source: r.source,
          restaurantId: r.restaurantId,
          restaurantName: r.restaurant.name,
        }))}
      />
    </div>
  );
}
