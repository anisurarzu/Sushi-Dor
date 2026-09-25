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
      className="relative border border-[color:var(--line)] px-3 py-2 text-[0.62rem] uppercase tracking-[0.12em] text-champagne transition-colors hover:border-gold sm:px-4"
      aria-label={`Panier, ${units} articles, ${total}`}
    >
      Panier
      {units > 0 ? (
        <span className="ml-2 text-gold">
          {units} · {total}
        </span>
      ) : null}
    </Link>
  );
}
