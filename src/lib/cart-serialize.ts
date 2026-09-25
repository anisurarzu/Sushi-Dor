import { formatEuro } from "@/lib/pricing";
import type { getOrCreateCart } from "@/lib/cart";

export function serializeCart(
  cart: Awaited<ReturnType<typeof getOrCreateCart>>,
) {
  const items = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    slug: item.product.slug,
    nameFr: item.productNameSnapshot,
    imageUrl: item.product.imageUrl,
    quantity: item.quantity,
    basePriceCents: item.basePriceSnapshot,
    unitPriceCents: item.unitPriceSnapshot,
    lineTotalCents: item.lineTotalCents,
    configSignature: item.configSignature,
    addons: item.addons.map((a) => ({
      id: a.id,
      addonId: a.addonId,
      nameFr: a.addonNameSnapshot,
      priceCents: a.priceSnapshot,
    })),
  }));

  const productsSubtotalCents = items.reduce(
    (s, i) => s + i.basePriceCents * i.quantity,
    0,
  );
  const addonsSubtotalCents = items.reduce(
    (s, i) =>
      s + i.addons.reduce((as, a) => as + a.priceCents, 0) * i.quantity,
    0,
  );
  const subtotalCents = items.reduce((s, i) => s + i.lineTotalCents, 0);
  const deliveryFeeCents =
    cart.orderType === "DELIVERY"
      ? (cart.restaurant?.deliveryFeeCents ?? 300)
      : 0;
  const totalCents = subtotalCents + deliveryFeeCents;

  return {
    id: cart.id,
    orderType: cart.orderType,
    restaurant: cart.restaurant
      ? {
          id: cart.restaurant.id,
          name: cart.restaurant.name,
          city: cart.restaurant.city,
          deliveryFeeCents: cart.restaurant.deliveryFeeCents,
          deliveryEnabled: cart.restaurant.deliveryEnabled,
          pickupEnabled: cart.restaurant.pickupEnabled,
        }
      : null,
    items,
    counts: {
      lines: items.length,
      units: items.reduce((s, i) => s + i.quantity, 0),
    },
    totals: {
      productsSubtotalCents,
      addonsSubtotalCents,
      subtotalCents,
      deliveryFeeCents,
      discountCents: 0,
      totalCents,
      formatted: {
        productsSubtotal: formatEuro(productsSubtotalCents),
        addonsSubtotal: formatEuro(addonsSubtotalCents),
        subtotal: formatEuro(subtotalCents),
        delivery: formatEuro(deliveryFeeCents),
        total: formatEuro(totalCents),
      },
    },
  };
}
