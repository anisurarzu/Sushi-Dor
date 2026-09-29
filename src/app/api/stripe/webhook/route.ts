import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { resolveOrderFromCheckoutSession } from "@/lib/order-resolve";
import type Stripe from "stripe";

export const runtime = "nodejs";

async function markOrderFailed(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentStatus === "PAID") return;
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "FAILED" },
    }),
    prisma.payment.updateMany({
      where: { orderId },
      data: { status: "FAILED" },
    }),
  ]);
}

async function markOrderRefunded(orderId: string, eventId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
    }),
    prisma.payment.updateMany({
      where: { orderId },
      data: { status: "REFUNDED", rawEventId: eventId },
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

  // Idempotent event de-dupe via Payment.rawEventId when possible
  const already = await prisma.payment.findFirst({
    where: { rawEventId: event.id },
  });
  if (already) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid" || event.type.includes("succeeded")) {
      const order = await resolveOrderFromCheckoutSession(session.id);
      if (order) {
        await prisma.payment.updateMany({
          where: { orderId: order.id, rawEventId: null },
          data: { rawEventId: event.id },
        });
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId =
      session.metadata?.orderId || session.client_reference_id || undefined;
    if (orderId) await markOrderFailed(orderId);
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const order = await prisma.order.findFirst({
      where: { stripePaymentIntentId: pi.id },
    });
    if (order) await markOrderFailed(order.id);
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const pi =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;
    if (pi) {
      const order = await prisma.order.findFirst({
        where: { stripePaymentIntentId: pi },
      });
      if (order) await markOrderRefunded(order.id, event.id);
    }
  }

  return NextResponse.json({ received: true });
}
