"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminSelect } from "@/components/admin/AdminSelect";

type Props = {
  q: string;
  status: string;
  payment: string;
  type: string;
};

const STATUS_OPTS = [
  { value: "", label: "Tous statuts" },
  ...[
    "PENDING_PAYMENT",
    "PAID",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "COMPLETED",
    "CANCELLED",
    "REFUNDED",
  ].map((s) => ({ value: s, label: s })),
];

const PAYMENT_OPTS = [
  { value: "", label: "Tous paiements" },
  ...["PAID", "PENDING", "FAILED", "REFUNDED", "UNPAID"].map((s) => ({
    value: s,
    label: s,
  })),
];

const TYPE_OPTS = [
  { value: "", label: "Tous types" },
  { value: "DELIVERY", label: "Livraison" },
  { value: "TAKEAWAY", label: "À emporter" },
  { value: "DINE_IN", label: "Sur place" },
];

export function OrdersFilters({ q, status, payment, type }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(q);
  const [st, setSt] = useState(status);
  const [pay, setPay] = useState(payment);
  const [tp, setTp] = useState(type);

  function apply(next?: {
    q?: string;
    status?: string;
    payment?: string;
    type?: string;
  }) {
    const params = new URLSearchParams();
    const qq = next?.q ?? query;
    const ss = next?.status ?? st;
    const pp = next?.payment ?? pay;
    const tt = next?.type ?? tp;
    if (qq.trim()) params.set("q", qq.trim());
    if (ss) params.set("status", ss);
    if (pp) params.set("payment", pp);
    if (tt) params.set("type", tt);
    const qs = params.toString();
    router.push(qs ? `/admin/orders?${qs}` : "/admin/orders");
  }

  return (
    <div className="grid gap-2 border border-[#c4a35a]/20 bg-[#12100e] p-3 sm:grid-cols-2 lg:grid-cols-5">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") apply();
        }}
        placeholder="Rechercher…"
        className="border border-[#c4a35a]/25 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[#c4a35a] lg:col-span-2"
      />
      <AdminSelect
        aria-label="Statut"
        options={STATUS_OPTS}
        value={st}
        onChange={(v) => {
          setSt(v);
          apply({ status: v });
        }}
      />
      <AdminSelect
        aria-label="Paiement"
        options={PAYMENT_OPTS}
        value={pay}
        onChange={(v) => {
          setPay(v);
          apply({ payment: v });
        }}
      />
      <AdminSelect
        aria-label="Type"
        options={TYPE_OPTS}
        value={tp}
        onChange={(v) => {
          setTp(v);
          apply({ type: v });
        }}
      />
      <button
        type="button"
        onClick={() => apply()}
        className="btn-gold px-3 py-2 text-[0.65rem] lg:col-span-5 lg:w-fit"
      >
        Filtrer
      </button>
    </div>
  );
}
