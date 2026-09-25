import Link from "next/link";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ order?: string; session_id?: string }> };

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { order: orderId, session_id } = await searchParams;

  let order = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { addons: true } },
          restaurant: true,
        },
      })
    : null;

  // Soft reconcile if webhook lagged (still requires Stripe session paid)
  if (
    order &&
    order.paymentStatus !== "PAID" &&
    session_id &&
    process.env.STRIPE_SECRET_KEY
  ) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (
        session.payment_status === "paid" &&
        (session.metadata?.orderId === order.id ||
          session.client_reference_id === order.id) &&
        (session.amount_total ?? 0) === order.totalCents
      ) {
        order = await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "PAID",
            paymentStatus: "PAID",
            paidAt: new Date(),
          },
          include: {
            items: { include: { addons: true } },
            restaurant: true,
          },
        });
      }
    } catch {
      // webhook remains source of truth; page stays pending
    }
  }

  return (
    <main className="bg-ink text-bone">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
        {!order ? (
          <>
            <h1 className="font-[family-name:var(--font-display)] text-4xl">
              Commande introuvable
            </h1>
            <Link href="/menu" className="btn-gold mt-8 inline-flex">
              Retour à la carte
            </Link>
          </>
        ) : (
          <>
            <p className="text-[0.7rem] uppercase tracking-[0.2em] text-gold">
              {order.paymentStatus === "PAID"
                ? "Paiement confirmé"
                : "Paiement en cours de confirmation"}
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl sm:text-5xl">
              Commande <span className="gold-text">confirmée</span>
            </h1>
            <p className="mt-4 text-mist">
              Votre commande{" "}
              <span className="text-champagne">{order.orderNumber}</span>{" "}
              {order.paymentStatus === "PAID"
                ? "est confirmée."
                : "a été reçue. La confirmation Stripe arrive sous peu."}
            </p>

            <div className="mt-8 border border-[color:var(--line)] p-5">
              <ul className="space-y-3 text-sm">
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
                      <p className="mt-1 text-xs text-mist">
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
              <div className="mt-4 flex justify-between border-t border-[color:var(--line)] pt-3">
                <span>Total</span>
                <span className="text-gold">{formatEuro(order.totalCents)}</span>
              </div>
            </div>

            <Link
              href={`/order/${order.id}`}
              className="btn-ghost mt-6 inline-flex"
            >
              Suivre la commande
            </Link>
          </>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
