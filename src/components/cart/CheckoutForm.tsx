"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { nanoid } from "nanoid";
import { useCart } from "@/components/cart/CartProvider";
import { formatEuro } from "@/lib/pricing";

const fieldClass =
  "w-full border border-[color:var(--line)] bg-ink-soft px-3 py-3 text-sm text-bone placeholder:text-mist/50 outline-none focus:border-gold";

export function CheckoutForm() {
  const { cart, loading, setOrderType } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const idempotencyKey = useMemo(() => nanoid(24), []);
  const [orderType, setLocalOrderType] = useState<"TAKEAWAY" | "DELIVERY">(
    "TAKEAWAY",
  );

  if (loading) return <p className="text-mist">Chargement…</p>;
  if (!cart || cart.items.length === 0) {
    return (
      <div>
        <p className="text-mist">Votre panier est vide.</p>
        <Link href="/menu" className="btn-gold mt-6 inline-flex">
          Voir la carte
        </Link>
      </div>
    );
  }

  const currentType =
    cart.orderType === "DELIVERY" || cart.orderType === "TAKEAWAY"
      ? cart.orderType
      : orderType;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const type = String(fd.get("orderType") || currentType) as
      | "TAKEAWAY"
      | "DELIVERY";

    const payload = {
      orderType: type,
      firstName: String(fd.get("firstName") || ""),
      lastName: String(fd.get("lastName") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      notes: String(fd.get("notes") || "") || undefined,
      deliveryStreet: String(fd.get("deliveryStreet") || "") || undefined,
      deliveryComplement:
        String(fd.get("deliveryComplement") || "") || undefined,
      deliveryPostalCode:
        String(fd.get("deliveryPostalCode") || "") || undefined,
      deliveryCity: String(fd.get("deliveryCity") || "") || undefined,
      deliveryNotes: String(fd.get("deliveryNotes") || "") || undefined,
      idempotencyKey,
    };

    const res = await fetch("/api/checkout/create-session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Le paiement n'a pas pu être effectué.");
      return;
    }
    window.location.href = data.checkoutUrl;
  }

  async function changeType(type: "TAKEAWAY" | "DELIVERY") {
    setLocalOrderType(type);
    await setOrderType(type);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)] lg:gap-10"
    >
      <div className="min-w-0 space-y-6">
        <section className="border border-[color:var(--line)] bg-ink-soft p-4 sm:p-5">
          <h2 className="text-[0.7rem] uppercase tracking-[0.16em] text-gold">
            Type de commande
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {cart.restaurant?.pickupEnabled ? (
              <label
                className={`cursor-pointer border px-4 py-2.5 text-[0.7rem] uppercase tracking-[0.12em] ${
                  currentType === "TAKEAWAY"
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-[color:var(--line)] text-mist"
                }`}
              >
                <input
                  type="radio"
                  name="orderType"
                  value="TAKEAWAY"
                  className="sr-only"
                  checked={currentType === "TAKEAWAY"}
                  onChange={() => changeType("TAKEAWAY")}
                />
                À emporter
              </label>
            ) : null}
            {cart.restaurant?.deliveryEnabled ? (
              <label
                className={`cursor-pointer border px-4 py-2.5 text-[0.7rem] uppercase tracking-[0.12em] ${
                  currentType === "DELIVERY"
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-[color:var(--line)] text-mist"
                }`}
              >
                <input
                  type="radio"
                  name="orderType"
                  value="DELIVERY"
                  className="sr-only"
                  checked={currentType === "DELIVERY"}
                  onChange={() => changeType("DELIVERY")}
                />
                Livraison
              </label>
            ) : null}
          </div>
        </section>

        <section className="border border-[color:var(--line)] bg-ink-soft p-4 sm:p-5">
          <h2 className="text-[0.7rem] uppercase tracking-[0.16em] text-gold">
            Vos informations
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              required
              name="firstName"
              placeholder="Prénom"
              autoComplete="given-name"
              className={fieldClass}
            />
            <input
              required
              name="lastName"
              placeholder="Nom"
              autoComplete="family-name"
              className={fieldClass}
            />
            <input
              required
              type="email"
              name="email"
              placeholder="Adresse e-mail"
              autoComplete="email"
              className={`${fieldClass} sm:col-span-2`}
            />
            <input
              required
              name="phone"
              placeholder="Téléphone"
              autoComplete="tel"
              className={`${fieldClass} sm:col-span-2`}
            />
            <textarea
              name="notes"
              placeholder="Notes (optionnel)"
              rows={3}
              className={`${fieldClass} resize-y sm:col-span-2`}
            />
          </div>
        </section>

        {currentType === "DELIVERY" ? (
          <section className="border border-[color:var(--line)] bg-ink-soft p-4 sm:p-5">
            <h2 className="text-[0.7rem] uppercase tracking-[0.16em] text-gold">
              Adresse de livraison
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                name="deliveryStreet"
                placeholder="Adresse"
                required
                autoComplete="street-address"
                className={`${fieldClass} sm:col-span-2`}
              />
              <input
                name="deliveryComplement"
                placeholder="Complément"
                className={`${fieldClass} sm:col-span-2`}
              />
              <input
                name="deliveryPostalCode"
                placeholder="Code postal"
                pattern="\d{5}"
                required
                autoComplete="postal-code"
                className={fieldClass}
              />
              <input
                name="deliveryCity"
                placeholder="Ville"
                required
                autoComplete="address-level2"
                className={fieldClass}
              />
              <input
                name="deliveryNotes"
                placeholder="Instructions de livraison"
                className={`${fieldClass} sm:col-span-2`}
              />
            </div>
          </section>
        ) : null}
      </div>

      <aside className="min-w-0 border border-[color:var(--line)] bg-ink-soft p-4 sm:p-6 lg:sticky lg:top-28 lg:h-fit">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-champagne">
          Votre commande
        </h2>
        <ul className="mt-4 max-h-[40vh] space-y-3 overflow-y-auto text-sm">
          {cart.items.map((item) => (
            <li
              key={item.id}
              className="border-b border-[color:var(--line)] pb-3 last:border-0"
            >
              <div className="flex gap-3">
                {item.imageUrl ? (
                  <div
                    className="h-14 w-14 shrink-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                    aria-hidden
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-champagne">
                      {item.nameFr}{" "}
                      <span className="text-mist">× {item.quantity}</span>
                    </p>
                    <p className="shrink-0 text-gold">
                      {formatEuro(item.lineTotalCents)}
                    </p>
                  </div>
                  {item.addons.length > 0 ? (
                    <p className="mt-1 text-xs leading-relaxed text-mist">
                      {item.addons.map((a) => a.nameFr).join(" · ")}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between gap-3 text-mist">
            <dt>Sous-total produits</dt>
            <dd className="text-bone">
              {cart.totals.formatted.productsSubtotal}
            </dd>
          </div>
          <div className="flex justify-between gap-3 text-mist">
            <dt>Options supplémentaires</dt>
            <dd className="text-bone">
              {cart.totals.formatted.addonsSubtotal}
            </dd>
          </div>
          <div className="flex justify-between gap-3 text-mist">
            <dt>Livraison</dt>
            <dd className="text-bone">
              {currentType === "DELIVERY"
                ? cart.totals.formatted.delivery
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-[color:var(--line)] pt-3 text-base text-champagne">
            <dt>Total</dt>
            <dd className="text-gold">{cart.totals.formatted.total}</dd>
          </div>
        </dl>

        {error ? (
          <p className="mt-4 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="btn-gold mt-6 w-full"
        >
          {pending ? "Redirection…" : "Procéder au paiement"}
        </button>
        <p className="mt-3 text-center text-xs text-mist">
          Paiement sécurisé via Stripe · 3D Secure
        </p>
      </aside>
    </form>
  );
}
