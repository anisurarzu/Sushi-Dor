import { NextResponse } from "next/server";
import { getOrCreateCart } from "@/lib/cart";
import { serializeCart } from "@/lib/cart-serialize";

export async function GET() {
  const cart = await getOrCreateCart();
  return NextResponse.json({ cart: serializeCart(cart) });
}
