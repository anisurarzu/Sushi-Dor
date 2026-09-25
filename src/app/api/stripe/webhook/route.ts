import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

export const runtime = "nodejs";

async function markOrderPaid(orderId: string, session: Stripe.Checkout.Session) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  if (order.paymentStatus === "PAID") return; // idempotent

  const amount = session.amount_total ?? order.totalCents;
  if (amount !== order.totalCents) {
    console.error("Stripe amount mismatch", {
      orderId,
      expected: order.totalCents,
      got: amount,
    });
    return;
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        paymentStatus: "PAID",
        paidAt: new Date(),
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id,
      },
    }),
    prisma.payment.updateMany({
      where: { orderId },
      data: {
        status: "PAID",
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id,
        rawEventId: session.id,
      },
    }),
  ]);
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET manquant" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("Webhook signature failed", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId =
      session.metadata?.orderId || session.client_reference_id || undefined;
    if (orderId && session.payment_status === "paid") {
      await markOrderPaid(orderId, session);
    }
  }

  if (event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId =
      session.metadata?.orderId || session.client_reference_id || undefined;
    if (orderId) await markOrderPaid(orderId, session);
  }

  return NextResponse.json({ received: true });
}
