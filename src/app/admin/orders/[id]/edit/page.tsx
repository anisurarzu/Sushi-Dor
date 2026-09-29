import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { OrderEditor } from "@/components/admin/OrderEditor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderEditPage({ params }: Props) {
  await requireAdmin("orders.edit");
  const { id } = await params;
  const [order, products, restaurants] = await Promise.all([
    prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: { items: { include: { addons: true } } },
    }),
    prisma.product.findMany({
      where: { isAvailable: true },
      orderBy: { nameFr: "asc" },
      include: {
        addonGroups: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
          include: {
            addons: {
              where: { isActive: true },
              orderBy: { displayOrder: "asc" },
            },
          },
        },
      },
    }),
    prisma.restaurant.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/admin/orders/${order.id}`} className="text-sm text-[#c4a35a]">
          ← {order.orderNumber}
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
          Modifier {order.orderNumber}
        </h1>
        <p className="mt-1 text-sm text-[#a89f8e]">
          Les prix historiques des articles existants sont conservés. Les
          nouveaux articles utilisent les tarifs actuels.
        </p>
      </div>
      <OrderEditor
        order={{
          id: order.id,
          orderNumber: order.orderNumber,
          customerFirstName: order.customerFirstName,
          customerLastName: order.customerLastName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail,
          type: order.type,
          deliveryStreet: order.deliveryStreet,
          deliveryComplement: order.deliveryComplement,
          deliveryPostalCode: order.deliveryPostalCode,
          deliveryCity: order.deliveryCity,
          notes: order.notes,
          deliveryFeeCents: order.deliveryFeeCents,
          discountCents: order.discountCents,
          discountCode: order.discountCode,
          subtotalCents: order.subtotalCents,
          totalCents: order.totalCents,
          paymentStatus: order.paymentStatus,
          restaurantId: order.restaurantId,
          items: order.items.map((i) => ({
            id: i.id,
            productId: i.productId,
            productNameSnapshot: i.productNameSnapshot,
            quantity: i.quantity,
            unitPriceSnapshot: i.unitPriceSnapshot,
            lineTotalCents: i.lineTotalCents,
            basePriceSnapshot: i.basePriceSnapshot,
            addons: i.addons.map((a) => ({
              id: a.id,
              addonId: a.addonId,
              addonNameSnapshot: a.addonNameSnapshot,
              priceSnapshot: a.priceSnapshot,
            })),
          })),
        }}
        products={products.map((p) => ({
          id: p.id,
          nameFr: p.nameFr,
          priceCents: p.priceCents,
          addonGroups: p.addonGroups.map((g) => ({
            id: g.id,
            nameFr: g.nameFr,
            selectionType: g.selectionType,
            required: g.required,
            minSelections: g.minSelections,
            maxSelections: g.maxSelections,
            addons: g.addons.map((a) => ({
              id: a.id,
              nameFr: a.nameFr,
              priceCents: a.priceCents,
              isActive: a.isActive,
            })),
          })),
        }))}
        restaurants={restaurants.map((r) => ({ id: r.id, name: r.name }))}
      />
    </div>
  );
}
