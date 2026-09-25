"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { nanoid } from "nanoid";
import { useCart } from "@/components/cart/CartProvider";

export function CheckoutForm() {
  const { cart, loading, setOrderType } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const idempotencyKey = useMemo(() => nanoid(24), []);

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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const orderType = String(fd.get("orderType") || cart!.orderType) as
      | "TAKEAWAY"
      | "DELIVERY";

    const payload = {
      orderType,
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

  return (
    <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <fieldset className="border border-[color:var(--line)] p-5">
          <legend className="px-1 text-[0.7rem] uppercase tracking-[0.16em] text-gold">
            Type de commande
          </legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {cart.restaurant?.pickupEnabled ? (
              <label className="flex items-center gap-2 text-sm text-champagne">
                <input
                  type="radio"
                  name="orderType"
                  value="TAKEAWAY"
                  defaultChecked={cart.orderType === "TAKEAWAY"}
                  onChange={() => setOrderType("TAKEAWAY")}
                />
                À emporter
              </label>
            ) : null}
            {cart.restaurant?.deliveryEnabled ? (
              <label className="flex items-center gap-2 text-sm text-champagne">
                <input
                  type="radio"
                  name="orderType"
                  value="DELIVERY"
                  defaultChecked={cart.orderType === "DELIVERY"}
                  onChange={() => setOrderType("DELIVERY")}
                />
                Livraison
              </label>
            ) : null}
          </div>
        </fieldset>

        <fieldset className="grid gap-3 border border-[color:var(--line)] p-5 sm:grid-cols-2">
          <legend className="px-1 text-[0.7rem] uppercase tracking-[0.16em] text-gold">
            Vos informations
          </legend>
          <input
            required
            name="firstName"
            placeholder="Prénom"
            className="border border-[color:var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
          <input
            required
            name="lastName"
            placeholder="Nom"
            className="border border-[color:var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
          <input
            required
            type="email"
            name="email"
            placeholder="Adresse e-mail"
            className="border border-[color:var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-gold sm:col-span-2"
          />
          <input
            required
            name="phone"
            placeholder="Téléphone"
            className="border border-[color:var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-gold sm:col-span-2"
          />
          <textarea
            name="notes"
            placeholder="Notes"
            rows={3}
            className="border border-[color:var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-gold sm:col-span-2"
          />
        </fieldset>

        {cart.orderType === "DELIVERY" || true ? (
          <fieldset
            className={`grid gap-3 border border-[color:var(--line)] p-5 sm:grid-cols-2 ${
              cart.orderType !== "DELIVERY" ? "opacity-50" : ""
            }`}
            disabled={cart.orderType !== "DELIVERY"}
          >
            <legend className="px-1 text-[0.7rem] uppercase tracking-[0.16em] text-gold">
              Adresse de livraison
            </legend>
            <input
              name="deliveryStreet"
              placeholder="Adresse"
              required={cart.orderType === "DELIVERY"}
              className="border border-[color:var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-gold sm:col-span-2"
            />
            <input
              name="deliveryComplement"
              placeholder="Complément"
              className="border border-[color:var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-gold sm:col-span-2"
            />
            <input
              name="deliveryPostalCode"
              placeholder="Code postal"
              pattern="\d{5}"
              required={cart.orderType === "DELIVERY"}
              className="border border-[color:var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-gold"
            />
            <input
              name="deliveryCity"
              placeholder="Ville"
              required={cart.orderType === "DELIVERY"}
              className="border border-[color:var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-gold"
            />
            <input
              name="deliveryNotes"
              placeholder="Instructions de livraison"
              className="border border-[color:var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-gold sm:col-span-2"
            />
          </fieldset>
        ) : null}
      </div>

      <aside className="h-fit border border-[color:var(--line)] p-5 sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-champagne">
          Votre commande
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          {cart.items.map((item) => (
            <li key={item.id} className="border-b border-[color:var(--line)] pb-3">
              <div className="flex justify-between gap-3">
                <span className="text-champagne">
                  {item.nameFr} × {item.quantity}
                </span>
                <span className="text-gold">
                  {cart.totals.formatted.total &&
                    new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    }).format(item.lineTotalCents / 100)}
                </span>
              </div>
              {item.addons.length > 0 ? (
                <p className="mt-1 text-xs text-mist">
                  {item.addons.map((a) => a.nameFr).join(" · ")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 text-sm">
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
          <div className="flex justify-between border-t border-[color:var(--line)] pt-3 text-champagne">
            <dt>Total</dt>
            <dd className="text-gold">{cart.totals.formatted.total}</dd>
          </div>
        </dl>

        {error ? (
          <p className="mt-4 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className="btn-gold mt-6 w-full">
          {pending ? "Redirection…" : "Procéder au paiement"}
        </button>
        <p className="mt-3 text-center text-xs text-mist">
          Paiement sécurisé via Stripe · 3D Secure
        </p>
      </aside>
    </form>
  );
}
