import Link from "next/link";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { OrderCelebration } from "@/components/checkout/OrderCelebration";
import { formatEuro } from "@/lib/pricing";
import { resolveOrderFromCheckoutSession } from "@/lib/order-resolve";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ session_id?: string; order?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id, order: orderParam } = await searchParams;

  let order = null as Awaited<
    ReturnType<typeof resolveOrderFromCheckoutSession>
  >;

  if (session_id) {
    try {
      order = await resolveOrderFromCheckoutSession(session_id);
    } catch (err) {
      console.error("resolveOrderFromCheckoutSession failed", err);
    }
  }

  if (!order && orderParam) {
    order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderParam }, { orderNumber: orderParam }],
      },
      include: {
        items: { include: { addons: true } },
        restaurant: true,
      },
    });
  }

  const paid = order?.paymentStatus === "PAID";
  const eta = order?.restaurant?.prepTimeMinutes ?? 30;

  const steps = [
    { label: "Commande reçue", done: Boolean(order) },
    { label: "Paiement confirmé", done: paid },
    {
      label: "Confirmée",
      done: paid && ["CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED"].includes(order?.status ?? ""),
    },
    {
      label: "En préparation",
      done: ["PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED"].includes(
        order?.status ?? "",
      ),
    },
    {
      label: "Prête",
      done: ["READY", "OUT_FOR_DELIVERY", "COMPLETED"].includes(
        order?.status ?? "",
      ),
    },
    {
      label: "Terminée",
      done: order?.status === "COMPLETED",
    },
  ];

  return (
    <main className="bg-ink text-bone">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
        {!order ? (
          <>
            <p className="text-[0.7rem] uppercase tracking-[0.2em] text-gold">
              Paiement
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl">
              Confirmation en cours
            </h1>
            <p className="mt-4 text-[#c4bbaa]">
              {session_id
                ? "Nous synchronisons votre paiement Stripe. Actualisez cette page dans quelques secondes."
                : "Lien de confirmation incomplet. Vérifiez votre e-mail ou contactez le restaurant."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {session_id ? (
                <Link
                  href={`/checkout/success?session_id=${encodeURIComponent(session_id)}`}
                  className="btn-gold"
                >
                  Actualiser
                </Link>
              ) : null}
              <Link href="/menu" className="btn-ghost">
                Retour à la carte
              </Link>
            </div>
          </>
        ) : (
          <>
            <OrderCelebration
              title="Merci pour votre commande !"
              subtitle={
                <>
                  {paid
                    ? "Votre paiement a été confirmé."
                    : "Votre paiement est en cours de confirmation Stripe."}{" "}
                  Commande{" "}
                  <span className="text-champagne">#{order.orderNumber}</span>
                </>
              }
            />

            <ol className="mt-8 animate-rise-delay space-y-2 border border-[color:var(--line)] bg-ink-soft p-5 text-sm">
              {steps.map((step) => (
                <li
                  key={step.label}
                  className={
                    step.done ? "text-champagne" : "text-[#c4bbaa]/70"
                  }
                >
                  {step.done ? "✓" : "○"} {step.label}
                </li>
              ))}
            </ol>

            <div className="mt-6 animate-rise-delay-2 border border-[color:var(--line)] bg-ink-soft p-5">
              <p className="text-sm text-[#c4bbaa]">
                {order.restaurant.name} ·{" "}
                {order.type === "DELIVERY" ? "Livraison" : "À emporter"} · ~{eta}{" "}
                min
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <div className="flex justify-between gap-3">
                      <span>
                        {item.productNameSnapshot} × {item.quantity}
                      </span>
                      <span className="tabular-nums text-gold">
                        {formatEuro(item.lineTotalCents)}
                      </span>
                    </div>
                    {item.addons.length > 0 ? (
                      <p className="mt-1 text-xs text-[#c4bbaa]">
                        {item.addons
                          .map(
                            (a) =>
                              `${a.addonNameSnapshot} × ${a.quantity}`,
                          )
                          .join(" · ")}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between border-t border-[color:var(--line)] pt-3 text-base">
                <span>Total</span>
                <span className="tabular-nums text-gold">
                  {formatEuro(order.totalCents)}
                </span>
              </div>
            </div>

            <Link
              href={`/order/${order.orderNumber}`}
              className="btn-gold mt-6 inline-flex animate-rise-delay-2"
            >
              Suivre ma commande
            </Link>
          </>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
