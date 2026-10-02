import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { ReprintButton } from "@/components/admin/ReprintButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const TIMELINE = [
  "PENDING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
] as const;

export default async function AdminOrderDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { OR: [{ id }, { orderNumber: id }] },
    include: {
      items: { include: { addons: true } },
      restaurant: true,
      payments: true,
      adjustments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  const auditLogs = await prisma.auditLog.findMany({
    where: { entity: "Order", entityId: order.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { email: true, firstName: true } } },
  });

  const idx = Math.max(
    0,
    TIMELINE.indexOf(
      (order.status === "CANCELLED" || order.status === "REFUNDED"
        ? "COMPLETED"
        : order.status) as (typeof TIMELINE)[number],
    ),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="text-sm text-[#c4a35a]">
          ← Commandes
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl">
              {order.orderNumber}
            </h1>
            <p className="mt-1 text-sm text-[#a89f8e]">
              {order.createdAt.toLocaleString("fr-FR")} · {order.restaurant.name}
            </p>
          </div>
          <Link
            href={`/admin/orders/${order.id}/edit`}
            className="btn-gold text-sm"
          >
            Modifier la commande
          </Link>
        </div>
        {order.paymentStatus === "PAID" ? (
          <div className="mt-3 max-w-xs">
            <ReprintButton
              ticket={{
                orderId: order.id,
                orderNumber: order.orderNumber,
                type: order.type,
                totalCents: order.totalCents,
                productsSubtotalCents: order.productsSubtotalCents,
                addonsSubtotalCents: order.addonsSubtotalCents,
                deliveryFeeCents: order.deliveryFeeCents,
                discountCents: order.discountCents,
                customerFirstName: order.customerFirstName,
                customerLastName: order.customerLastName,
                customerPhone: order.customerPhone,
                deliveryStreet: order.deliveryStreet,
                deliveryComplement: order.deliveryComplement,
                deliveryPostalCode: order.deliveryPostalCode,
                deliveryCity: order.deliveryCity,
                deliveryNotes: order.deliveryNotes,
                notes: order.notes,
                paidAt: order.paidAt?.toISOString() ?? null,
                createdAt: order.createdAt.toISOString(),
                restaurant: {
                  name: order.restaurant.name,
                  address: order.restaurant.address,
                  postalCode: order.restaurant.postalCode,
                  city: order.restaurant.city,
                  phone: order.restaurant.phone,
                },
                items: order.items.map((item) => ({
                  productNameSnapshot: item.productNameSnapshot,
                  quantity: item.quantity,
                  lineTotalCents: item.lineTotalCents,
                  addons: item.addons.map((a) => ({
                    addonNameSnapshot: a.addonNameSnapshot,
                    priceSnapshot: a.priceSnapshot,
                  })),
                })),
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <section className="border border-[#c4a35a]/20 bg-[#12100e] p-4">
            <h2 className="text-[0.65rem] uppercase tracking-[0.16em] text-[#c4a35a]">
              Client
            </h2>
            <p className="mt-2 text-[#f0e6c8]">
              {order.customerFirstName} {order.customerLastName}
            </p>
            <p className="text-sm text-[#c4bbaa]">{order.customerPhone}</p>
            <p className="text-sm text-[#c4bbaa]">{order.customerEmail}</p>
            <p className="mt-3 text-sm">
              Type: <span className="text-[#e0c878]">{order.type}</span>
            </p>
            {order.type === "DELIVERY" ? (
              <p className="mt-2 text-sm text-[#c4bbaa]">
                {[
                  order.deliveryStreet,
                  order.deliveryComplement,
                  `${order.deliveryPostalCode || ""} ${order.deliveryCity || ""}`,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            ) : null}
            {order.notes ? (
              <p className="mt-2 text-sm text-[#a89f8e]">Notes: {order.notes}</p>
            ) : null}
          </section>

          <section className="border border-[#c4a35a]/20 bg-[#12100e] p-4">
            <h2 className="text-[0.65rem] uppercase tracking-[0.16em] text-[#c4a35a]">
              Articles
            </h2>
            <ul className="mt-3 space-y-3 text-sm">
              {order.items.map((item) => (
                <li key={item.id}>
                  <div className="flex justify-between gap-3">
                    <span>
                      {item.productNameSnapshot} × {item.quantity}
                    </span>
                    <span className="text-[#e0c878]">
                      {formatEuro(item.lineTotalCents)}
                    </span>
                  </div>
                  {item.addons.length > 0 ? (
                    <ul className="mt-1 space-y-0.5 text-xs text-[#a89f8e]">
                      {item.addons.map((a) => (
                        <li key={a.id}>
                          {a.addonNameSnapshot} × {a.quantity} —{" "}
                          {formatEuro(a.lineTotalCents)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-[#c4a35a]/20 pt-3 text-sm">
              <div className="flex justify-between">
                <dt>Sous-total</dt>
                <dd>{formatEuro(order.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Livraison</dt>
                <dd>{formatEuro(order.deliveryFeeCents)}</dd>
              </div>
              <div className="flex justify-between text-base text-[#e0c878]">
                <dt>Total</dt>
                <dd>{formatEuro(order.totalCents)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="space-y-4">
          <section className="border border-[#c4a35a]/20 bg-[#12100e] p-4 text-sm">
            <p>
              Paiement:{" "}
              <span className="text-[#e0c878]">{order.paymentStatus}</span>
            </p>
            <p className="mt-1">
              Provider:{" "}
              <span className="text-[#c4bbaa]">
                {order.payments[0]?.provider || "stripe"}
              </span>
            </p>
            <p className="mt-1">
              Statut commande:{" "}
              <span className="text-[#e0c878]">{order.status}</span>
            </p>
            {order.stripeSessionId ? (
              <details className="mt-3 text-xs text-[#a89f8e]">
                <summary className="cursor-pointer text-[#c4a35a]">
                  Détails Stripe
                </summary>
                <p className="mt-2 break-all">Session: {order.stripeSessionId}</p>
                {order.stripePaymentIntentId ? (
                  <p className="mt-1 break-all">
                    PI: {order.stripePaymentIntentId}
                  </p>
                ) : null}
              </details>
            ) : null}
          </section>

          <OrderStatusForm orderId={order.id} current={order.status} />

          <section className="border border-[#c4a35a]/20 bg-[#12100e] p-4">
            <h3 className="text-[0.65rem] uppercase tracking-[0.16em] text-[#c4a35a]">
              Timeline
            </h3>
            <ol className="mt-3 space-y-2 text-sm">
              {TIMELINE.map((step, i) => (
                <li
                  key={step}
                  className={
                    i <= idx ||
                    (step === "PAID" && order.paymentStatus === "PAID")
                      ? "text-[#f0e6c8]"
                      : "text-[#a89f8e]/60"
                  }
                >
                  {i <= idx ||
                  (step === "PAID" && order.paymentStatus === "PAID")
                    ? "✓"
                    : "○"}{" "}
                  {step}
                </li>
              ))}
            </ol>
          </section>

          {order.adjustments.length > 0 ? (
            <section className="border border-[#c4a35a]/20 bg-[#12100e] p-4">
              <h3 className="text-[0.65rem] uppercase tracking-[0.16em] text-[#c4a35a]">
                Ajustements paiement
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-[#c4bbaa]">
                {order.adjustments.map((a) => (
                  <li key={a.id}>
                    {a.createdAt.toLocaleString("fr-FR")} · {a.kind} ·{" "}
                    {formatEuro(a.amountCents)}
                    {a.note ? ` — ${a.note}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="border border-[#c4a35a]/20 bg-[#12100e] p-4">
            <h3 className="text-[0.65rem] uppercase tracking-[0.16em] text-[#c4a35a]">
              Historique modifications
            </h3>
            {auditLogs.length === 0 ? (
              <p className="mt-2 text-xs text-[#a89f8e]">Aucune modification.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-xs text-[#c4bbaa]">
                {auditLogs.map((log) => (
                  <li key={log.id}>
                    {log.createdAt.toLocaleString("fr-FR")} · {log.action}
                    {log.user?.email ? ` · ${log.user.email}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
