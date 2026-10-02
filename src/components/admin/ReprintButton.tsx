"use client";

import { useState } from "react";
import { formatEuro } from "@/lib/pricing";

export type TicketPreview = {
  orderId: string;
  orderNumber: string;
  type: string;
  totalCents: number;
  productsSubtotalCents: number;
  addonsSubtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  deliveryStreet: string | null;
  deliveryComplement: string | null;
  deliveryPostalCode: string | null;
  deliveryCity: string | null;
  deliveryNotes: string | null;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
  restaurant: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    phone: string | null;
  };
  items: {
    productNameSnapshot: string;
    quantity: number;
    lineTotalCents: number;
    addons: {
      addonNameSnapshot: string;
      priceSnapshot: number;
    }[];
  }[];
};

function typeLabel(type: string) {
  if (type === "DELIVERY") return "Livraison";
  if (type === "DINE_IN") return "Sur place";
  return "À emporter";
}

export function ReprintButton({ ticket }: { ticket: TicketPreview }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function confirmReprint() {
    setPending(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${ticket.orderId}/reprint`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || "Échec");
      } else {
        setMsg("Ticket envoyé à l'imprimante (file d'attente)");
        window.setTimeout(() => setOpen(false), 900);
      }
    } catch {
      setMsg("Erreur réseau");
    } finally {
      setPending(false);
    }
  }

  const when = new Date(ticket.paidAt || ticket.createdAt).toLocaleString(
    "fr-FR",
  );

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => {
          setMsg(null);
          setOpen(true);
        }}
        className="btn-ghost w-full cursor-pointer text-sm"
      >
        Réimprimer le ticket
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu du ticket"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto border border-[color:var(--line)] bg-ink shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[color:var(--line)] px-4 py-3">
              <p className="text-[0.65rem] uppercase tracking-[0.16em] text-gold">
                Aperçu du ticket
              </p>
              <p className="mt-1 text-sm text-mist">
                Vérifiez avant d&apos;envoyer à l&apos;imprimante
              </p>
            </div>

            {/* Receipt-style preview */}
            <div className="bg-[#f7f2e8] px-5 py-5 font-mono text-[0.78rem] leading-relaxed text-[#0c0a08]">
              <div className="text-center">
                <p className="text-base font-semibold tracking-wide">
                  SUSHI D&apos;OR
                </p>
                <p className="mt-1">{ticket.restaurant.name}</p>
                <p>{ticket.restaurant.address}</p>
                <p>
                  {ticket.restaurant.postalCode} {ticket.restaurant.city}
                </p>
                {ticket.restaurant.phone ? (
                  <p>{ticket.restaurant.phone}</p>
                ) : null}
              </div>

              <div className="my-3 border-t border-dashed border-[#0c0a08]/35" />

              <p className="text-center text-lg font-bold">
                #{ticket.orderNumber}
              </p>
              <p className="text-center font-semibold uppercase">
                {typeLabel(ticket.type)}
              </p>
              <p className="mt-1 text-center text-[0.7rem]">{when}</p>

              <div className="my-3 border-t border-dashed border-[#0c0a08]/35" />

              <p>
                {ticket.customerFirstName} {ticket.customerLastName}
              </p>
              <p>{ticket.customerPhone}</p>
              {ticket.type === "DELIVERY" ? (
                <div className="mt-2">
                  <p className="font-semibold">Adresse livraison</p>
                  {ticket.deliveryStreet ? <p>{ticket.deliveryStreet}</p> : null}
                  {ticket.deliveryComplement ? (
                    <p>{ticket.deliveryComplement}</p>
                  ) : null}
                  <p>
                    {ticket.deliveryPostalCode} {ticket.deliveryCity}
                  </p>
                  {ticket.deliveryNotes ? (
                    <p>Note: {ticket.deliveryNotes}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="my-3 border-t border-dashed border-[#0c0a08]/35" />

              <ul className="space-y-2">
                {ticket.items.map((item, i) => (
                  <li key={i}>
                    <div className="flex justify-between gap-2">
                      <span>
                        {item.quantity}× {item.productNameSnapshot}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {formatEuro(item.lineTotalCents)}
                      </span>
                    </div>
                    {item.addons.map((a, j) => (
                      <p key={j} className="pl-3 text-[0.7rem] opacity-80">
                        + {a.addonNameSnapshot}
                        {a.priceSnapshot > 0
                          ? ` ${formatEuro(a.priceSnapshot)}`
                          : ""}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>

              <div className="my-3 border-t border-dashed border-[#0c0a08]/35" />

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{formatEuro(ticket.productsSubtotalCents)}</span>
                </div>
                {ticket.addonsSubtotalCents > 0 ? (
                  <div className="flex justify-between">
                    <span>Options</span>
                    <span>{formatEuro(ticket.addonsSubtotalCents)}</span>
                  </div>
                ) : null}
                {ticket.deliveryFeeCents > 0 ? (
                  <div className="flex justify-between">
                    <span>Livraison</span>
                    <span>{formatEuro(ticket.deliveryFeeCents)}</span>
                  </div>
                ) : null}
                {ticket.discountCents > 0 ? (
                  <div className="flex justify-between">
                    <span>Remise</span>
                    <span>-{formatEuro(ticket.discountCents)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-1 text-base font-bold">
                  <span>TOTAL</span>
                  <span>{formatEuro(ticket.totalCents)}</span>
                </div>
                <p className="pt-1">Payé — Stripe</p>
              </div>

              {ticket.notes ? (
                <>
                  <div className="my-3 border-t border-dashed border-[#0c0a08]/35" />
                  <p>Note: {ticket.notes}</p>
                </>
              ) : null}

              <p className="mt-4 text-center">Merci et bon appétit !</p>
            </div>

            <div className="space-y-2 border-t border-[color:var(--line)] p-4">
              {msg ? (
                <p
                  className={`text-xs ${
                    msg.includes("envoyé") ? "text-gold" : "text-red-300"
                  }`}
                >
                  {msg}
                </p>
              ) : null}
              <button
                type="button"
                disabled={pending}
                onClick={() => void confirmReprint()}
                className="btn-gold w-full cursor-pointer disabled:opacity-60"
              >
                {pending ? "Envoi…" : "Confirmer l'impression"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setOpen(false)}
                className="w-full cursor-pointer py-2 text-[0.68rem] uppercase tracking-[0.12em] text-mist hover:text-champagne"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
