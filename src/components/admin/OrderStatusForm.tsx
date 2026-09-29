"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminSelect } from "@/components/admin/AdminSelect";

const STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
] as const;

const LABELS: Record<string, string> = {
  PENDING_PAYMENT: "En attente de paiement",
  PAID: "Payée",
  CONFIRMED: "Confirmée",
  PREPARING: "En préparation",
  READY: "Prête",
  OUT_FOR_DELIVERY: "En livraison",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

type Props = { orderId: string; current: string };

export function OrderStatusForm({ orderId, current }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(confirm = false) {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, confirm }),
    });
    const data = await res.json();
    setPending(false);
    if (res.status === 409 && data.requiresConfirm) {
      const ok = window.confirm(
        status === "CANCELLED"
          ? "Êtes-vous sûr de vouloir annuler cette commande ?"
          : `${data.error}\nConfirmer quand même ?`,
      );
      if (ok) return save(true);
      return;
    }
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3 border border-[#c4a35a]/25 bg-[#12100e] p-4">
      <h3 className="text-[0.65rem] uppercase tracking-[0.16em] text-[#c4a35a]">
        Actions
      </h3>
      <Link
        href={`/admin/orders/${orderId}/edit`}
        className="btn-gold flex w-full items-center justify-center text-sm"
      >
        Éditer la commande
      </Link>
      <div className="border-t border-[#c4a35a]/15 pt-3">
        <p className="mb-2 text-[0.65rem] uppercase tracking-[0.16em] text-[#a89f8e]">
          Statut
        </p>
        <AdminSelect
          aria-label="Statut de la commande"
          value={status}
          onChange={setStatus}
          options={STATUSES.map((s) => ({
            value: s,
            label: LABELS[s] || s,
          }))}
        />
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button
        type="button"
        disabled={pending || status === current}
        onClick={() => save(false)}
        className="w-full border border-[#c4a35a]/40 px-3 py-2 text-sm text-[#e0c878] disabled:opacity-50"
      >
        {pending ? "…" : "Mettre à jour le statut"}
      </button>
    </div>
  );
}
