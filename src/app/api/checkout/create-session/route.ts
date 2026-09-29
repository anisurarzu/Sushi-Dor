import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";
import { recalculateLine } from "@/lib/catalog";
import { PricingError } from "@/lib/pricing";
import { checkoutSchema } from "@/lib/validators";
import { appUrl, getStripe } from "@/lib/stripe";

const orderNumber = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

export async function POST(req: Request) {
  try {
    const body = checkoutSchema.parse(await req.json());
    const cart = await getOrCreateCart();

    if (!cart.restaurantId || !cart.restaurant) {
      return NextResponse.json(
        { error: "Restaurant non configuré." },
        { status: 400 },
      );
    }
    if (cart.items.length === 0) {
      return NextResponse.json(
        { error: "Votre panier est vide." },
        { status: 400 },
      );
    }

    // Idempotency: return existing pending Stripe session
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: body.idempotencyKey },
    });
    if (existing?.stripeSessionId) {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(
        existing.stripeSessionId,
      );
      if (session.status === "open" && session.url) {
        return NextResponse.json({
          orderId: existing.id,
          orderNumber: existing.orderNumber,
          checkoutUrl: session.url,
        });
      }
      if (existing.paymentStatus === "PAID") {
        return NextResponse.json({
          orderId: existing.id,
          orderNumber: existing.orderNumber,
          checkoutUrl: `${appUrl()}/checkout/success?session_id=${existing.stripeSessionId}`,
        });
      }
    }

    if (body.orderType === "DELIVERY") {
      if (!cart.restaurant.deliveryEnabled) {
        return NextResponse.json(
          { error: "La livraison n'est pas disponible." },
          { status: 400 },
        );
      }
      if (
        !body.deliveryStreet ||
        !body.deliveryPostalCode ||
        !body.deliveryCity
      ) {
        return NextResponse.json(
          { error: "Veuillez vérifier votre adresse de livraison." },
          { status: 400 },
        );
      }
      const zone = await prisma.deliveryZone.findFirst({
        where: {
          restaurantId: cart.restaurantId,
          isActive: true,
          postalCodes: { has: body.deliveryPostalCode },
        },
      });
      if (!zone) {
        return NextResponse.json(
          {
            error:
              "Cette zone de livraison n'est pas couverte. Vérifiez le code postal.",
          },
          { status: 400 },
        );
      }
    }

    // Server-side recalculation of every line from live DB prices
    let productsSubtotalCents = 0;
    let addonsSubtotalCents = 0;
    const pricedLines = [];

    for (const item of cart.items) {
      const addonIds = item.addons.map((a) => a.addonId);
      const priced = await recalculateLine(
        item.productId,
        addonIds,
        item.quantity,
      );
      productsSubtotalCents += priced.productsSubtotalCents;
      addonsSubtotalCents += priced.addonsSubtotalCents;
      pricedLines.push(priced);

      if (
        priced.unitPriceCents !== item.unitPriceSnapshot ||
        priced.basePriceCents !== item.basePriceSnapshot
      ) {
        await prisma.cartItem.update({
          where: { id: item.id },
          data: {
            productNameSnapshot: priced.productNameFr,
            basePriceSnapshot: priced.basePriceCents,
            unitPriceSnapshot: priced.unitPriceCents,
            lineTotalCents: priced.lineTotalCents,
          },
        });
      }
    }

    const subtotalCents = productsSubtotalCents + addonsSubtotalCents;
    const deliveryFeeCents =
      body.orderType === "DELIVERY" ? cart.restaurant.deliveryFeeCents : 0;
    const discountCents = 0;
    const totalCents = subtotalCents + deliveryFeeCents - discountCents;

    if (totalCents < 50) {
      return NextResponse.json(
        { error: "Montant de commande trop bas." },
        { status: 400 },
      );
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const line of pricedLines) {
      lineItems.push({
        quantity: line.quantity,
        price_data: {
          currency: "eur",
          unit_amount: line.basePriceCents,
          product_data: {
            name: line.productNameFr,
          },
        },
      });
      for (const addon of line.addons) {
        if (addon.priceCents <= 0) continue;
        lineItems.push({
          quantity: line.quantity,
          price_data: {
            currency: "eur",
            unit_amount: addon.priceCents,
            product_data: {
              name: `${addon.nameFr} (supplément)`,
            },
          },
        });
      }
    }

    if (deliveryFeeCents > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: deliveryFeeCents,
          product_data: { name: "Livraison" },
        },
      });
    }

    const stripeLineTotal = lineItems.reduce(
      (sum, li) =>
        sum + (li.price_data?.unit_amount ?? 0) * (li.quantity ?? 1),
      0,
    );
    if (stripeLineTotal !== totalCents) {
      // Fallback: single verified total (DB remains source of truth)
      lineItems.length = 0;
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: totalCents,
          product_data: {
            name: `Commande Sushi D'or`,
            description: `${pricedLines.length} article(s)`,
          },
        },
      });
    }

    const order =
      existing && existing.paymentStatus !== "PAID"
        ? await prisma.order.update({
            where: { id: existing.id },
            data: {
              type: body.orderType,
              productsSubtotalCents,
              addonsSubtotalCents,
              subtotalCents,
              deliveryFeeCents,
              discountCents,
              totalCents,
              customerEmail: body.email,
              customerPhone: body.phone,
              customerFirstName: body.firstName,
              customerLastName: body.lastName,
              deliveryStreet: body.deliveryStreet,
              deliveryComplement: body.deliveryComplement,
              deliveryPostalCode: body.deliveryPostalCode,
              deliveryCity: body.deliveryCity,
              deliveryNotes: body.deliveryNotes,
              notes: body.notes,
              status: "PENDING_PAYMENT",
              paymentStatus: "PENDING",
            },
          })
        : await prisma.order.create({
            data: {
              orderNumber: `SD${orderNumber()}`,
              idempotencyKey: body.idempotencyKey,
              restaurantId: cart.restaurantId,
              type: body.orderType,
              status: "PENDING_PAYMENT",
              paymentStatus: "PENDING",
              productsSubtotalCents,
              addonsSubtotalCents,
              subtotalCents,
              deliveryFeeCents,
              discountCents,
              totalCents,
              customerEmail: body.email,
              customerPhone: body.phone,
              customerFirstName: body.firstName,
              customerLastName: body.lastName,
              deliveryStreet: body.deliveryStreet,
              deliveryComplement: body.deliveryComplement,
              deliveryPostalCode: body.deliveryPostalCode,
              deliveryCity: body.deliveryCity,
              deliveryNotes: body.deliveryNotes,
              notes: body.notes,
              items: {
                create: pricedLines.map((line) => ({
                  productId: line.productId,
                  productNameSnapshot: line.productNameFr,
                  basePriceSnapshot: line.basePriceCents,
                  unitPriceSnapshot: line.unitPriceCents,
                  quantity: line.quantity,
                  lineTotalCents: line.lineTotalCents,
                  addons: {
                    create: line.addons.map((a) => ({
                      addonId: a.addonId,
                      addonNameSnapshot: a.nameFr,
                      priceSnapshot: a.priceCents,
                      quantity: line.quantity,
                      lineTotalCents: a.priceCents * line.quantity,
                    })),
                  },
                })),
              },
              payments: {
                create: {
                  provider: "stripe",
                  status: "PENDING",
                  amountCents: totalCents,
                  currency: "EUR",
                },
              },
            },
          });

    // If updating existing pending order, refresh line items
    if (existing && existing.paymentStatus !== "PAID") {
      await prisma.orderItemAddon.deleteMany({
        where: { orderItem: { orderId: order.id } },
      });
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
      for (const line of pricedLines) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: line.productId,
            productNameSnapshot: line.productNameFr,
            basePriceSnapshot: line.basePriceCents,
            unitPriceSnapshot: line.unitPriceCents,
            quantity: line.quantity,
            lineTotalCents: line.lineTotalCents,
            addons: {
              create: line.addons.map((a) => ({
                addonId: a.addonId,
                addonNameSnapshot: a.nameFr,
                priceSnapshot: a.priceCents,
                quantity: line.quantity,
                lineTotalCents: a.priceCents * line.quantity,
              })),
            },
          },
        });
      }
      await prisma.payment.updateMany({
        where: { orderId: order.id },
        data: { amountCents: totalCents, status: "PENDING" },
      });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.email,
      client_reference_id: order.id,
      line_items: lineItems,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        cartId: cart.id,
      },
      success_url: `${appUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/checkout/cancel?order=${order.id}`,
      locale: "fr",
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });
    await prisma.payment.updateMany({
      where: { orderId: order.id },
      data: { stripeSessionId: session.id },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Impossible de créer la session de paiement." },
        { status: 500 },
      );
    }

    // Keep cart until webhook confirms payment (cancel returns to cart)

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      checkoutUrl: session.url,
      totalCents,
    });
  } catch (err) {
    if (err instanceof PricingError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 400 },
      );
    }
    console.error("checkout error", err);
    const message =
      err instanceof Error && err.message.includes("STRIPE_SECRET_KEY")
        ? err.message
        : "Le paiement n'a pas pu être initialisé. Veuillez réessayer.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
