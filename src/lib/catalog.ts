import { prisma } from "@/lib/prisma";
import {
  priceProductLine,
  type ProductForPricing,
} from "@/lib/pricing";

export async function loadProductForPricing(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      addonGroups: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        include: {
          addons: {
            where: { isActive: true },
            orderBy: { displayOrder: "asc" },
          },
        },
      },
    },
  });
  if (!product) return null;
  return product as ProductForPricing;
}

export async function recalculateLine(
  productId: string,
  addonIds: string[],
  quantity: number,
) {
  const product = await loadProductForPricing(productId);
  if (!product) {
    throw new Error("Produit introuvable.");
  }
  const restaurant = await prisma.restaurant.findFirst({
    where: { isActive: true },
  });
  return priceProductLine(
    product,
    addonIds,
    quantity,
    restaurant?.maxItemQuantity ?? 20,
  );
}
