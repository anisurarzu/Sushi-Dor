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
  if (type === "DELIVERY") return "LIVRAISON";
  if (type === "DINE_IN") return "SUR PLACE";
  return "A EMPORTER";
}

function shortName(first: string, last: string) {
  const f = first.trim();
  const l = last.trim();
  if (!f && !l) return "Client";
  if (!l) return f;
  return `${f} ${l.charAt(0).toUpperCase()}.`;
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

  const when = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ticket.paidAt || ticket.createdAt));
  const customer = shortName(
    ticket.customerFirstName,
    ticket.customerLastName,
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

            {/* Uber Eats–style preview (no QR) */}
            <div className="bg-white px-5 py-5 font-sans text-[15px] leading-snug text-[#111]">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[1.35rem] font-extrabold tracking-tight">
                  SUSHI D&apos;OR
                </p>
                <p className="text-[0.95rem] font-semibold uppercase tracking-wide text-[#333]">
                  {typeLabel(ticket.type)}
                </p>
              </div>
              {ticket.restaurant.address &&
              !/^à préciser$/i.test(ticket.restaurant.address.trim()) ? (
                <p className="mt-1 text-[13px] text-[#444]">
                  {ticket.restaurant.address}
                </p>
              ) : null}
              <p className="text-[13px] text-[#444]">
                {ticket.restaurant.postalCode} {ticket.restaurant.city}
              </p>

              <div className="mt-3 flex items-center justify-between gap-3 bg-[#2a2a2a] px-3 py-2.5 text-white">
                <p className="text-[1.15rem] font-bold">{customer}</p>
                <p className="text-[1.25rem] font-extrabold">
                  #{ticket.orderNumber}
                </p>
              </div>
              <p className="mt-2 text-[13px]">Tel: {ticket.customerPhone}</p>
              {ticket.type === "DELIVERY" ? (
                <div className="mt-1 text-[13px] text-[#333]">
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

              <div className="my-3 border-t border-[#ccc]" />

              <ul className="space-y-2.5">
                {ticket.items.map((item, i) => (
                  <li key={i}>
                    <div className="flex justify-between gap-3 text-[1.05rem] font-bold">
                      <span>
                        {item.quantity} x {item.productNameSnapshot}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {formatEuro(item.lineTotalCents)}
                      </span>
                    </div>
                    {item.addons.map((a, j) => (
                      <div
                        key={j}
                        className="mt-0.5 flex justify-between gap-3 pl-3 text-[13px] text-[#444]"
                      >
                        <span>{a.addonNameSnapshot}</span>
                        {a.priceSnapshot > 0 ? (
                          <span className="shrink-0 tabular-nums">
                            {formatEuro(a.priceSnapshot)}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </li>
                ))}
              </ul>

              <div className="my-3 border-t border-[#ccc]" />

              <div className="space-y-1.5">
                <div className="flex justify-between text-[14px]">
                  <span>Sous-total</span>
                  <span className="tabular-nums">
                    {formatEuro(ticket.productsSubtotalCents)}
                  </span>
                </div>
                {ticket.addonsSubtotalCents > 0 ? (
                  <div className="flex justify-between text-[14px]">
                    <span>Options</span>
                    <span className="tabular-nums">
                      {formatEuro(ticket.addonsSubtotalCents)}
                    </span>
                  </div>
                ) : null}
                {ticket.deliveryFeeCents > 0 ? (
                  <div className="flex justify-between text-[14px]">
                    <span>Livraison</span>
                    <span className="tabular-nums">
                      {formatEuro(ticket.deliveryFeeCents)}
                    </span>
                  </div>
                ) : null}
                {ticket.discountCents > 0 ? (
                  <div className="flex justify-between text-[14px]">
                    <span>Remise</span>
                    <span className="tabular-nums">
                      -{formatEuro(ticket.discountCents)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-1 text-[1.2rem] font-extrabold">
                  <span>Montant payé</span>
                  <span className="tabular-nums">
                    {formatEuro(ticket.totalCents)}
                  </span>
                </div>
                <p className="pt-0.5 text-[13px] text-[#444]">Payé — Stripe</p>
              </div>

              {ticket.notes ? (
                <>
                  <div className="my-3 border-t border-[#ccc]" />
                  <p className="text-[13px]">Note: {ticket.notes}</p>
                </>
              ) : null}

              <div className="my-3 border-t border-[#ccc]" />
              <p className="text-[13px] text-[#444]">Effectuée le {when}</p>
              <p className="mt-3 text-center text-[13px] text-[#333]">
                Merci pour votre commande
                <br />
                Sushi D&apos;or
              </p>
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
