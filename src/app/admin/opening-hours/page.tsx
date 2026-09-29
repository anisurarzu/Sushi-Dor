import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { OpeningHoursEditor } from "@/components/admin/OpeningHoursEditor";

export const dynamic = "force-dynamic";

export default async function AdminOpeningHoursPage() {
  await requireAdmin("settings.edit");
  const restaurants = await prisma.restaurant.findMany({
    include: { openingHours: true, blockedDates: true },
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Horaires
        </h1>
        <p className="mt-1 text-sm text-[#a89f8e]">
          Les modifications impactent immédiatement la disponibilité commande /
          réservation.
        </p>
      </div>
      {restaurants.map((r) => (
        <OpeningHoursEditor
          key={r.id}
          restaurantId={r.id}
          restaurantName={r.name}
          initialHours={r.openingHours.map((h) => ({
            id: h.id,
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            service: h.service,
            isClosed: h.isClosed,
          }))}
          initialBlocked={r.blockedDates.map((d) => ({
            id: d.id,
            date: d.date.toISOString().slice(0, 10),
            reason: d.reason,
          }))}
        />
      ))}
    </div>
  );
}
