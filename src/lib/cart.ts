import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";

export const CART_COOKIE = "sd_cart";

export async function getOrCreateCart() {
  const jar = await cookies();
  let token = jar.get(CART_COOKIE)?.value;
  if (!token) {
    token = nanoid(32);
    jar.set(CART_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  let cart = await prisma.cart.findUnique({
    where: { sessionToken: token },
    include: cartInclude,
  });

  if (!cart) {
    const restaurant = await prisma.restaurant.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    cart = await prisma.cart.create({
      data: {
        sessionToken: token,
        restaurantId: restaurant?.id,
        orderType: "TAKEAWAY",
      },
      include: cartInclude,
    });
  }

  return cart;
}

export const cartInclude = {
  items: {
    include: {
      addons: true,
      product: {
        include: {
          addonGroups: {
            where: { isActive: true },
            orderBy: { displayOrder: "asc" as const },
            include: {
              addons: {
                where: { isActive: true },
                orderBy: { displayOrder: "asc" as const },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  restaurant: true,
} as const;

export async function getCartByToken(token: string) {
  return prisma.cart.findUnique({
    where: { sessionToken: token },
    include: cartInclude,
  });
}
