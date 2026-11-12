"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

const HIDDEN_PREFIXES = ["/cart", "/checkout", "/admin", "/print"];

function euro(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function FloatingCart() {
  const { cart } = useCart();
  const pathname = usePathname();
  const dockRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const hidden = HIDDEN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const items = cart?.items ?? [];
  const units = cart?.counts.units ?? 0;
  const total = cart?.totals.formatted.total ?? "0,00 €";

  useEffect(() => {
    function onPulse() {
      setPulse(true);
      window.setTimeout(() => setPulse(false), 900);
    }
    window.addEventListener("sd:cart-dock-pulse", onPulse);
    return () => window.removeEventListener("sd:cart-dock-pulse", onPulse);
  }, []);

  function clearClose() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    clearClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 180);
  }

  if (hidden) return null;

  return (
    <div
      ref={dockRef}
      className={`floating-cart ${pulse ? "is-pulse" : ""} ${open ? "is-open" : ""}`}
      onMouseEnter={() => {
        clearClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
      onFocusCapture={() => {
        clearClose();
        setOpen(true);
      }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          scheduleClose();
        }
      }}
    >
      <div
        className={`floating-cart__preview ${open ? "is-visible" : ""}`}
        role="dialog"
        aria-label="Aperçu du panier"
        aria-hidden={!open}
      >
        <div className="floating-cart__preview-head">
          <p>Votre panier</p>
          <span>{units} art.</span>
        </div>

        {items.length === 0 ? (
          <p className="floating-cart__empty">Aucun produit pour le moment.</p>
        ) : (
          <ul className="floating-cart__list">
            {items.map((item) => (
              <li key={item.id} className="floating-cart__row">
                <div className="floating-cart__thumb">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <span>SD</span>
                  )}
                </div>
                <div className="floating-cart__meta">
                  <p className="floating-cart__name">
                    {item.quantity}× {item.nameFr}
                  </p>
                  {item.addons.length > 0 ? (
                    <p className="floating-cart__addons">
                      {item.addons.map((a) => a.nameFr).join(", ")}
                    </p>
                  ) : null}
                </div>
                <p className="floating-cart__price">
                  {euro(item.lineTotalCents)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="floating-cart__preview-foot">
          <span>Total</span>
          <strong>{total}</strong>
        </div>
        <Link href="/cart" className="floating-cart__cta">
          Voir le panier
        </Link>
      </div>

      <Link
        href="/cart"
        data-cart-dock
        className="floating-cart__btn"
        aria-label={`Panier, ${units} articles, ${total}`}
      >
        <svg viewBox="0 0 24 24" className="floating-cart__icon" aria-hidden>
          <path
            d="M6.5 7h11l-.7 10.2a1.5 1.5 0 0 1-1.5 1.4H8.7a1.5 1.5 0 0 1-1.5-1.4L6.5 7Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M9 7V5.8A2.8 2.8 0 0 1 11.8 3h.4A2.8 2.8 0 0 1 15 5.8V7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {units > 0 ? (
          <span className="floating-cart__count" aria-hidden>
            {units > 99 ? "99+" : units}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
