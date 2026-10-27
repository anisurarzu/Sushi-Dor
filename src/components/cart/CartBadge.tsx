"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

export function CartBadge() {
  const { cart } = useCart();
  const units = cart?.counts.units ?? 0;
  const total = cart?.totals.formatted.total ?? "0,00 €";

  return (
    <Link
      href="/cart"
      data-cart-badge
      className="header-cta header-cta--ghost cart-badge relative cursor-pointer"
      aria-label={`Panier, ${units} articles, ${total}`}
      title={units > 0 ? `${units} · ${total}` : "Panier"}
    >
      Panier
      {units > 0 ? (
        <span className="header-cta__badge cart-badge-count" aria-hidden>
          {units > 99 ? "99+" : units}
        </span>
      ) : null}
    </Link>
  );
}
