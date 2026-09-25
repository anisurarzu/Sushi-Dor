"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatEuro } from "@/lib/pricing";

export function CartPageClient() {
  const { cart, loading, updateQty, removeItem, setOrderType } = useCart();

  if (loading) {
    return <p className="text-mist">Chargement du panier…</p>;
  }
  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center">
        <p className="text-mist">Votre panier est vide.</p>
        <Link href="/menu" className="btn-gold mt-6 inline-flex">
          Continuer mes achats
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="space-y-4">
        {cart.items.map((item) => (
          <article
            key={item.id}
            className="border border-[color:var(--line)] p-4 sm:p-5"
          >
            <div className="flex gap-4">
              {item.imageUrl ? (
                <div
                  className="hidden h-24 w-24 shrink-0 bg-cover bg-center sm:block"
                  style={{ backgroundImage: `url(${item.imageUrl})` }}
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-[family-name:var(--font-display)] text-xl text-champagne">
                    {item.nameFr}
                  </h2>
                  <p className="shrink-0 text-gold">
                    {formatEuro(item.lineTotalCents)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-mist">
                  Base {formatEuro(item.basePriceCents)}
                </p>
                {item.addons.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm text-mist">
                    {item.addons.map((a) => (
                      <li key={a.id}>
                        • {a.nameFr}{" "}
                        {a.priceCents > 0
                          ? `+${formatEuro(a.priceCents)}`
                          : "(gratuit)"}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center border border-[color:var(--line)]">
                    <button
                      type="button"
                      className="px-3 py-1.5"
                      onClick={() =>
                        updateQty(item.id, Math.max(1, item.quantity - 1))
                      }
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="px-3 py-1.5"
                      onClick={() =>
                        updateQty(item.id, Math.min(20, item.quantity + 1))
                      }
                    >
                      +
                    </button>
                  </div>
                  <Link
                    href={`/menu/${item.slug}?edit=${item.id}`}
                    className="text-[0.68rem] uppercase tracking-[0.14em] text-gold"
                  >
                    Modifier
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-[0.68rem] uppercase tracking-[0.14em] text-mist hover:text-champagne"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="h-fit border border-[color:var(--line)] p-5 sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-champagne">
          Récapitulatif
        </h2>

        <div className="mt-5 space-y-2">
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-gold">
            Type de commande
          </p>
          <div className="flex flex-wrap gap-2">
            {(["TAKEAWAY", "DELIVERY"] as const).map((type) => {
              const enabled =
                type === "DELIVERY"
                  ? cart.restaurant?.deliveryEnabled
                  : cart.restaurant?.pickupEnabled;
              if (!enabled) return null;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type)}
                  className={`border px-3 py-2 text-[0.65rem] uppercase tracking-[0.12em] ${
                    cart.orderType === type
                      ? "border-gold text-gold"
                      : "border-[color:var(--line)] text-mist"
                  }`}
                >
                  {type === "DELIVERY" ? "Livraison" : "À emporter"}
                </button>
              );
            })}
          </div>
        </div>

        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between text-mist">
            <dt>Sous-total produits</dt>
            <dd>{cart.totals.formatted.productsSubtotal}</dd>
          </div>
          <div className="flex justify-between text-mist">
            <dt>Options supplémentaires</dt>
            <dd>{cart.totals.formatted.addonsSubtotal}</dd>
          </div>
          <div className="flex justify-between text-mist">
            <dt>Livraison</dt>
            <dd>
              {cart.orderType === "DELIVERY"
                ? cart.totals.formatted.delivery
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between border-t border-[color:var(--line)] pt-3 text-base text-champagne">
            <dt>Total</dt>
            <dd className="text-gold">{cart.totals.formatted.total}</dd>
          </div>
        </dl>

        <Link href="/checkout" className="btn-gold mt-6 w-full">
          Passer la commande
        </Link>
        <Link
          href="/menu"
          className="mt-3 block text-center text-[0.68rem] uppercase tracking-[0.14em] text-mist hover:text-champagne"
        >
          Continuer mes achats
        </Link>
      </aside>
    </div>
  );
}
