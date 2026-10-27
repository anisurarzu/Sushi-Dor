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
      className="header-action cart-badge relative cursor-pointer border border-[color:var(--line)] text-champagne transition-colors hover:border-gold"
      aria-label={`Panier, ${units} articles, ${total}`}
    >
      Panier
      {units > 0 ? (
        <span className="ml-2 inline-flex items-center gap-1 text-gold">
          <span className="cart-badge-count">{units}</span>
          <span className="hidden sm:inline">· {total}</span>
        </span>
      ) : null}
    </Link>
  );
}
