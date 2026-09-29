import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const steps = [
  { key: "PENDING_PAYMENT", label: "Commande reçue" },
  { key: "PAID", label: "Paiement confirmé" },
  { key: "PREPARING", label: "En préparation" },
  { key: "READY", label: "Prête" },
  { key: "OUT_FOR_DELIVERY", label: "En livraison" },
  { key: "COMPLETED", label: "Terminée" },
] as const;

type Props = { params: Promise<{ orderId: string }> };

export default async function OrderTrackingPage({ params }: Props) {
  const { orderId } = await params;
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderId }, { orderNumber: orderId }],
    },
    include: { items: { include: { addons: true } }, restaurant: true },
  });
  if (!order) notFound();

  const statusOrder = [
    "PENDING_PAYMENT",
    "PAID",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "COMPLETED",
  ];
  const mappedStatus =
    order.status === "CONFIRMED" || order.paymentStatus === "PAID"
      ? order.status === "PENDING_PAYMENT"
        ? "PAID"
        : order.status
      : order.status;
  const currentIdx = Math.max(0, statusOrder.indexOf(mappedStatus));

  return (
    <main className="bg-ink text-bone">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
        <p className="text-[0.7rem] uppercase tracking-[0.2em] text-gold">
          Suivi
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl">
          Commande #{order.orderNumber}
        </h1>
        <p className="mt-2 text-[#c4bbaa]">
          {order.restaurant.name} ·{" "}
          {order.type === "DELIVERY" ? "Livraison" : "À emporter"} · Total{" "}
          {formatEuro(order.totalCents)} · Paiement {order.paymentStatus}
        </p>

        <ol className="mt-10 space-y-4">
          {steps.map((step) => {
            const stepIdx = statusOrder.indexOf(step.key);
            const done =
              currentIdx >= stepIdx ||
              (step.key === "PAID" && order.paymentStatus === "PAID") ||
              (step.key === "PENDING_PAYMENT" && Boolean(order));
            return (
              <li key={step.key} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-7 w-7 items-center justify-center border ${
                    done
                      ? "border-gold text-gold"
                      : "border-[color:var(--line)] text-mist"
                  }`}
                >
                  {done ? "✓" : "○"}
                </span>
                <span className={done ? "text-champagne" : "text-mist"}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>

        <ul className="mt-10 space-y-3 border border-[color:var(--line)] p-5 text-sm">
          {order.items.map((item) => (
            <li key={item.id}>
              <div className="flex justify-between gap-3">
                <span>
                  {item.productNameSnapshot} × {item.quantity}
                </span>
                <span className="text-gold">
                  {formatEuro(item.lineTotalCents)}
                </span>
              </div>
              {item.addons.length > 0 ? (
                <span className="mt-1 block text-xs text-mist">
                  {item.addons
                    .map((a) => `${a.addonNameSnapshot} × ${a.quantity}`)
                    .join(" · ")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>

        <Link href="/menu" className="btn-ghost mt-8 inline-flex">
          Retour à la carte
        </Link>
      </div>
      <SiteFooter />
    </main>
  );
}
