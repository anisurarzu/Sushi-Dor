import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";
import { DeliveryZonesEditor } from "@/components/admin/DeliveryZonesEditor";

export const dynamic = "force-dynamic";

export default async function AdminDeliveryPage() {
  await requireAdmin("ADMIN");
  const restaurants = await prisma.restaurant.findMany({
    include: { deliveryZones: { orderBy: { name: "asc" } } },
  });
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#c4a35a]">Ops</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl">Livraison</h1>
      </div>
      {restaurants.map((r) => (
        <section key={r.id} className="space-y-3">
          <h2 className="text-xl text-[#f0e6c8]">{r.name} — frais défaut {formatEuro(r.deliveryFeeCents)}</h2>
          <DeliveryZonesEditor
            restaurantId={r.id}
            initial={r.deliveryZones.map((z) => ({
              id: z.id,
              name: z.name,
              postalCodes: z.postalCodes,
              feeCents: z.feeCents,
              minOrderCents: z.minOrderCents,
              isActive: z.isActive,
            }))}
          />
        </section>
      ))}
    </div>
  );
}
