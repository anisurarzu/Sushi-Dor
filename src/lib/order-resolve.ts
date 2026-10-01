import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { enqueuePrintForOrder } from "@/lib/print";

const orderInclude = {
  items: { include: { addons: true } },
  restaurant: true,
} as const;

export type ResolvedOrder = NonNullable<
  Awaited<ReturnType<typeof prisma.order.findFirst<{ include: typeof orderInclude }>>>
>;

async function markPaid(
  orderId: string,
  session: Stripe.Checkout.Session,
): Promise<ResolvedOrder> {
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "CONFIRMED",
      paymentStatus: "PAID",
      paidAt: new Date(),
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
    },
    include: orderInclude,
  });

  await prisma.payment.updateMany({
    where: { orderId },
    data: {
      status: "PAID",
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
    },
  });

  if (session.metadata?.cartId) {
    await prisma.cartItemAddon.deleteMany({
      where: { cartItem: { cartId: session.metadata.cartId } },
    });
    await prisma.cartItem.deleteMany({
      where: { cartId: session.metadata.cartId },
    });
  }

  // Queue kitchen/customer receipt for local Epson agent
  void enqueuePrintForOrder(order.id).catch((err) =>
    console.error("enqueuePrintForOrder failed", order.id, err),
  );

  return order;
}

/** Rebuild a missing order from a paid Stripe Checkout Session (data-loss recovery). */
async function recoverOrderFromSession(
  session: Stripe.Checkout.Session,
): Promise<ResolvedOrder | null> {
  if (session.payment_status !== "paid") return null;

  const restaurant = await prisma.restaurant.findFirst({
    where: { isActive: true },
  });
  if (!restaurant) return null;

  const orderNumber =
    session.metadata?.orderNumber ||
    `SD${session.id.slice(-8).toUpperCase()}`;
  const existingNumber = await prisma.order.findUnique({
    where: { orderNumber },
  });
  if (existingNumber) {
    return markPaid(existingNumber.id, session);
  }

  const expanded = await getStripe().checkout.sessions.retrieve(session.id, {
    expand: ["line_items.data.price.product"],
  });
  const lines = expanded.line_items?.data ?? [];
  const totalCents = session.amount_total ?? 0;
  const email =
    session.customer_details?.email ||
    session.customer_email ||
    "client@sushidor.fr";
  const name = session.customer_details?.name || "Client";
  const [firstName, ...rest] = name.split(" ");
  const lastName = rest.join(" ") || "Sushi D'or";

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const order = await prisma.order.create({
    data: {
      ...(session.metadata?.orderId
        ? { id: session.metadata.orderId }
        : {}),
      orderNumber,
      restaurantId: restaurant.id,
      type: "TAKEAWAY",
      status: "CONFIRMED",
      paymentStatus: "PAID",
      productsSubtotalCents: totalCents,
      addonsSubtotalCents: 0,
      subtotalCents: totalCents,
      deliveryFeeCents: 0,
      discountCents: 0,
      totalCents,
      customerEmail: email,
      customerPhone: session.customer_details?.phone || "—",
      customerFirstName: firstName || "Client",
      customerLastName: lastName,
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      paidAt: new Date(),
      notes: "Commande récupérée depuis Stripe (session payée).",
      items: {
        create:
          lines.length > 0
            ? lines.map((li) => {
                const productName =
                  typeof li.price?.product === "object" &&
                  li.price.product &&
                  "name" in li.price.product
                    ? String(li.price.product.name)
                    : li.description || "Article";
                const unit = li.amount_total
                  ? Math.round(li.amount_total / Math.max(1, li.quantity ?? 1))
                  : li.price?.unit_amount ?? 0;
                const qty = li.quantity ?? 1;
                return {
                  productNameSnapshot: productName,
                  basePriceSnapshot: unit,
                  unitPriceSnapshot: unit,
                  quantity: qty,
                  lineTotalCents: li.amount_total ?? unit * qty,
                };
              })
            : [
                {
                  productNameSnapshot: `Commande ${orderNumber}`,
                  basePriceSnapshot: totalCents,
                  unitPriceSnapshot: totalCents,
                  quantity: 1,
                  lineTotalCents: totalCents,
                },
              ],
      },
      payments: {
        create: {
          provider: "stripe",
          status: "PAID",
          amountCents: totalCents,
          currency: "EUR",
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          rawEventId: `recover:${session.id}`,
        },
      },
    },
    include: orderInclude,
  });

  void enqueuePrintForOrder(order.id).catch((err) =>
    console.error("enqueuePrintForOrder failed", order.id, err),
  );

  return order;
}

/**
 * Resolve a customer order from a Stripe Checkout Session id.
 * Authoritative path: DB order linked by stripeSessionId / metadata.orderId.
 * Fallback: recover from paid Stripe session if DB row was lost.
 */
export async function resolveOrderFromCheckoutSession(
  sessionId: string,
): Promise<ResolvedOrder | null> {
  if (!sessionId.startsWith("cs_")) return null;

  let order = await prisma.order.findFirst({
    where: { stripeSessionId: sessionId },
    include: orderInclude,
  });

  const stripe = getStripe();
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return order;
  }

  if (!order && session.metadata?.orderId) {
    order = await prisma.order.findUnique({
      where: { id: session.metadata.orderId },
      include: orderInclude,
    });
  }

  if (!order && session.client_reference_id) {
    order = await prisma.order.findUnique({
      where: { id: session.client_reference_id },
      include: orderInclude,
    });
  }

  if (!order && session.metadata?.orderNumber) {
    order = await prisma.order.findUnique({
      where: { orderNumber: session.metadata.orderNumber },
      include: orderInclude,
    });
  }

  if (!order && session.payment_status === "paid") {
    order = await recoverOrderFromSession(session);
  }

  if (
    order &&
    order.paymentStatus !== "PAID" &&
    session.payment_status === "paid" &&
    (session.amount_total ?? 0) === order.totalCents
  ) {
    order = await markPaid(order.id, session);
  } else if (
    order &&
    order.paymentStatus !== "PAID" &&
    session.payment_status === "paid" &&
    // recovery / metadata match — still mark paid even if amount drifted
    (session.metadata?.orderId === order.id ||
      session.client_reference_id === order.id ||
      session.metadata?.orderNumber === order.orderNumber)
  ) {
    order = await markPaid(order.id, session);
  } else if (order && !order.stripeSessionId) {
    order = await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
      include: orderInclude,
    });
  }

  return order;
}
