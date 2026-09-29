import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { DiscountManager } from "@/components/admin/DiscountManager";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  await requireAdmin("discounts.view");
  const discounts = await prisma.discount.findMany({
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Codes promo
        </h1>
        <p className="mt-1 text-sm text-[#a89f8e]">
          Validation côté serveur à chaque checkout.
        </p>
      </div>
      <DiscountManager
        initial={discounts.map((d) => ({
          id: d.id,
          code: d.code,
          description: d.description,
          percentOff: d.percentOff,
          amountOffCents: d.amountOffCents,
          minOrderCents: d.minOrderCents,
          startsAt: d.startsAt?.toISOString() || null,
          endsAt: d.endsAt?.toISOString() || null,
          maxUses: d.maxUses,
          usedCount: d.usedCount,
          isActive: d.isActive,
        }))}
      />
    </div>
  );
}
