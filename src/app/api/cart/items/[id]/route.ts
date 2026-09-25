import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart, cartInclude } from "@/lib/cart";
import { recalculateLine } from "@/lib/catalog";
import { PricingError } from "@/lib/pricing";
import {
  removeCartItemSchema,
  updateCartItemQtySchema,
} from "@/lib/validators";
import { serializeCart } from "@/lib/cart-serialize";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = updateCartItemQtySchema
      .omit({ cartItemId: true })
      .extend({ quantity: z.number().int().min(1).max(20) })
      .parse(await req.json());

    const cart = await getOrCreateCart();
    const item = await prisma.cartItem.findFirst({
      where: { id, cartId: cart.id },
      include: { addons: true },
    });
    if (!item) {
      return NextResponse.json({ error: "Article introuvable." }, { status: 404 });
    }

    const priced = await recalculateLine(
      item.productId,
      item.addons.map((a) => a.addonId),
      body.quantity,
    );

    await prisma.cartItem.update({
      where: { id: item.id },
      data: {
        quantity: priced.quantity,
        productNameSnapshot: priced.productNameFr,
        basePriceSnapshot: priced.basePriceCents,
        unitPriceSnapshot: priced.unitPriceCents,
        lineTotalCents: priced.lineTotalCents,
      },
    });

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
    return NextResponse.json(
      { error: "Mise à jour impossible." },
      { status: 400 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  removeCartItemSchema.parse({ cartItemId: id });
  const cart = await getOrCreateCart();
  await prisma.cartItem.deleteMany({ where: { id, cartId: cart.id } });
  const refreshed = await prisma.cart.findUniqueOrThrow({
    where: { id: cart.id },
    include: cartInclude,
  });
  return NextResponse.json({ cart: serializeCart(refreshed) });
}
