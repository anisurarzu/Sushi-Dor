"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatEuro } from "@/lib/pricing";
import { AdminSelect } from "@/components/admin/AdminSelect";

type Discount = {
  id: string;
  code: string;
  description: string | null;
  percentOff: number | null;
  amountOffCents: number | null;
  minOrderCents: number;
  startsAt: string | null;
  endsAt: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
};

export function DiscountManager({ initial }: { initial: Discount[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [minOrder, setMinOrder] = useState("0");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const num = Number(value.replace(",", "."));
    const payload = {
      code,
      percentOff: kind === "percent" ? Math.round(num) : null,
      amountOffCents: kind === "fixed" ? Math.round(num * 100) : null,
      minOrderCents: Math.round(Number(minOrder.replace(",", ".")) * 100) || 0,
      isActive: true,
    };
    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setRows((prev) => [data.discount, ...prev]);
    setCode("");
    router.refresh();
  }

  async function toggle(id: string, isActive: boolean) {
    const res = await fetch(`/api/admin/discounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setRows((prev) => prev.map((d) => (d.id === id ? data.discount : d)));
    router.refresh();
  }

  async function archive(id: string) {
    if (!confirm("Archiver ce code promo ?")) return;
    const res = await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setRows((prev) => prev.map((d) => (d.id === id ? data.discount : d)));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={create}
        className="grid gap-3 border border-[#c4a35a]/20 bg-[#12100e] p-4 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-[0.65rem] uppercase tracking-wider text-[#c4a35a]">
          Nouveau code
        </h2>
        <label className="block text-sm">
          Code
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
        <div className="block text-sm">
          <span className="mb-1 block">Type</span>
          <AdminSelect
            aria-label="Type de promo"
            value={kind}
            onChange={(v) => setKind(v as "percent" | "fixed")}
            options={[
              { value: "percent", label: "Pourcentage" },
              { value: "fixed", label: "Montant fixe (€)" },
            ]}
          />
        </div>
        <label className="block text-sm">
          Valeur
          <input
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Minimum commande (€)
          <input
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
        {error ? (
          <p className="sm:col-span-2 text-sm text-red-300">{error}</p>
        ) : null}
        <button type="submit" disabled={pending} className="btn-gold sm:col-span-2">
          {pending ? "Enregistrement…" : "Créer"}
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-[#a89f8e]">Aucun code promo.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-[#c4a35a]/20 bg-[#12100e] p-3"
            >
              <div>
                <span className="text-[#e0c878]">{d.code}</span> —{" "}
                {d.percentOff
                  ? `${d.percentOff}%`
                  : formatEuro(d.amountOffCents || 0)}{" "}
                · min {formatEuro(d.minOrderCents)} ·{" "}
                {d.isActive ? "actif" : "inactif"} · utilisé {d.usedCount}
                {d.maxUses ? `/${d.maxUses}` : ""}
              </div>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  className="text-[#c4a35a]"
                  onClick={() => void toggle(d.id, d.isActive)}
                >
                  {d.isActive ? "Désactiver" : "Activer"}
                </button>
                <button
                  type="button"
                  className="text-red-300"
                  onClick={() => void archive(d.id)}
                >
                  Archiver
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
