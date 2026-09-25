import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart, cartInclude } from "@/lib/cart";
import { serializeCart } from "@/lib/cart-serialize";
import { z } from "zod";

const schema = z.object({
  orderType: z.enum(["TAKEAWAY", "DELIVERY", "DINE_IN"]),
});

export async function PATCH(req: Request) {
  const body = schema.parse(await req.json());
  const cart = await getOrCreateCart();

  if (body.orderType === "DELIVERY" && cart.restaurant && !cart.restaurant.deliveryEnabled) {
    return NextResponse.json(
      { error: "La livraison n'est pas disponible pour ce restaurant." },
      { status: 400 },
    );
  }
  if (body.orderType === "TAKEAWAY" && cart.restaurant && !cart.restaurant.pickupEnabled) {
    return NextResponse.json(
      { error: "Le click & collect n'est pas disponible." },
      { status: 400 },
    );
  }

  await prisma.cart.update({
    where: { id: cart.id },
    data: { orderType: body.orderType },
  });

  const refreshed = await prisma.cart.findUniqueOrThrow({
    where: { id: cart.id },
    include: cartInclude,
  });
  return NextResponse.json({ cart: serializeCart(refreshed) });
}
