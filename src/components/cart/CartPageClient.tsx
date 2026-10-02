"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { OrderTypeToggle } from "@/components/cart/OrderTypeToggle";
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
    <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] lg:gap-10">
      <div className="min-w-0 space-y-4">
        {cart.items.map((item) => (
          <article
            key={item.id}
            className="border border-[color:var(--line)] bg-ink-soft p-4 sm:p-5"
          >
            <div className="flex gap-3 sm:gap-4">
              {item.imageUrl ? (
                <div
                  className="h-16 w-16 shrink-0 bg-cover bg-center sm:h-24 sm:w-24"
                  style={{ backgroundImage: `url(${item.imageUrl})` }}
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-[family-name:var(--font-display)] text-lg leading-snug text-champagne sm:text-xl">
                    {item.nameFr}
                  </h2>
                  <p className="shrink-0 text-sm text-gold sm:text-base">
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
                  <div className="inline-flex items-stretch overflow-hidden border border-[color:var(--line)] bg-ink">
                    <button
                      type="button"
                      className="cursor-pointer px-3 py-1.5 text-champagne transition-colors hover:bg-gold/10 hover:text-gold"
                      onClick={() =>
                        updateQty(item.id, Math.max(1, item.quantity - 1))
                      }
                      aria-label="Diminuer"
                    >
                      −
                    </button>
                    <span className="flex min-w-9 items-center justify-center border-x border-[color:var(--line)] px-2 text-sm font-medium tabular-nums text-bone">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="cursor-pointer px-3 py-1.5 text-champagne transition-colors hover:bg-gold/10 hover:text-gold"
                      onClick={() =>
                        updateQty(item.id, Math.min(20, item.quantity + 1))
                      }
                      aria-label="Augmenter"
                    >
                      +
                    </button>
                  </div>
                  <Link
                    href={`/menu/${item.slug}?edit=${item.id}`}
                    className="cursor-pointer text-[0.68rem] uppercase tracking-[0.14em] text-gold hover:text-gold-bright"
                  >
                    Modifier
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="cursor-pointer text-[0.68rem] uppercase tracking-[0.14em] text-mist hover:text-champagne"
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
          <OrderTypeToggle
            value={
              cart.orderType === "DELIVERY" ? "DELIVERY" : "TAKEAWAY"
            }
            onChange={(type) => void setOrderType(type)}
            pickupEnabled={cart.restaurant?.pickupEnabled}
            deliveryEnabled={cart.restaurant?.deliveryEnabled}
            name="cartOrderType"
          />
        </div>

        <dl className="mt-6 space-y-2.5 text-sm">
          <div className="flex justify-between gap-3 text-[#c4bbaa]">
            <dt>Sous-total produits</dt>
            <dd className="tabular-nums text-bone">
              {cart.totals.formatted.productsSubtotal}
            </dd>
          </div>
          <div className="flex justify-between gap-3 text-[#c4bbaa]">
            <dt>Options supplémentaires</dt>
            <dd className="tabular-nums text-bone">
              {cart.totals.formatted.addonsSubtotal}
            </dd>
          </div>
          <div className="flex justify-between gap-3 text-[#c4bbaa]">
            <dt>Livraison</dt>
            <dd className="tabular-nums text-bone">
              {cart.orderType === "DELIVERY"
                ? cart.totals.formatted.delivery
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-[color:var(--line)] pt-3 text-base text-champagne">
            <dt className="font-medium">Total</dt>
            <dd className="tabular-nums text-gold">
              {cart.totals.formatted.total}
            </dd>
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
