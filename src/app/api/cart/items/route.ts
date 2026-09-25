import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart, cartInclude } from "@/lib/cart";
import { recalculateLine } from "@/lib/catalog";
import { PricingError } from "@/lib/pricing";
import { addToCartSchema } from "@/lib/validators";
import { serializeCart } from "@/lib/cart-serialize";

export async function POST(req: Request) {
  try {
    const body = addToCartSchema.parse(await req.json());
    const priced = await recalculateLine(
      body.productId,
      body.addonIds,
      body.quantity,
    );
    const cart = await getOrCreateCart();

    if (body.cartItemId) {
      const existing = await prisma.cartItem.findFirst({
        where: { id: body.cartItemId, cartId: cart.id },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "Article introuvable dans le panier." },
          { status: 404 },
        );
      }

      // If signature changed to match another line, merge
      const conflict = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          configSignature: priced.configSignature,
          NOT: { id: existing.id },
        },
      });

      if (conflict) {
        await prisma.$transaction([
          prisma.cartItem.update({
            where: { id: conflict.id },
            data: {
              quantity: conflict.quantity + priced.quantity,
              lineTotalCents:
                conflict.unitPriceSnapshot *
                (conflict.quantity + priced.quantity),
            },
          }),
          prisma.cartItemAddon.deleteMany({ where: { cartItemId: existing.id } }),
          prisma.cartItem.delete({ where: { id: existing.id } }),
        ]);
      } else {
        await prisma.$transaction([
          prisma.cartItemAddon.deleteMany({ where: { cartItemId: existing.id } }),
          prisma.cartItem.update({
            where: { id: existing.id },
            data: {
              productNameSnapshot: priced.productNameFr,
              basePriceSnapshot: priced.basePriceCents,
              quantity: priced.quantity,
              unitPriceSnapshot: priced.unitPriceCents,
              lineTotalCents: priced.lineTotalCents,
              configSignature: priced.configSignature,
              addons: {
                create: priced.addons.map((a) => ({
                  addonId: a.addonId,
                  addonNameSnapshot: a.nameFr,
                  priceSnapshot: a.priceCents,
                })),
              },
            },
          }),
        ]);
      }
    } else {
      const existing = await prisma.cartItem.findUnique({
        where: {
          cartId_configSignature: {
            cartId: cart.id,
            configSignature: priced.configSignature,
          },
        },
      });

      if (existing) {
        const quantity = existing.quantity + priced.quantity;
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity,
            lineTotalCents: existing.unitPriceSnapshot * quantity,
            // refresh snapshots from current pricing
            productNameSnapshot: priced.productNameFr,
            basePriceSnapshot: priced.basePriceCents,
            unitPriceSnapshot: priced.unitPriceCents,
          },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: priced.productId,
            productNameSnapshot: priced.productNameFr,
            basePriceSnapshot: priced.basePriceCents,
            quantity: priced.quantity,
            unitPriceSnapshot: priced.unitPriceCents,
            lineTotalCents: priced.lineTotalCents,
            configSignature: priced.configSignature,
            addons: {
              create: priced.addons.map((a) => ({
                addonId: a.addonId,
                addonNameSnapshot: a.nameFr,
                priceSnapshot: a.priceCents,
              })),
            },
          },
        });
      }
    }

    const refreshed = await prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: cartInclude,
    });
    return NextResponse.json({ cart: serializeCart(refreshed) });
  } catch (err) {
    if (err instanceof PricingError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 400 },
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: "Impossible d'ajouter au panier." },
      { status: 400 },
    );
  }
}
