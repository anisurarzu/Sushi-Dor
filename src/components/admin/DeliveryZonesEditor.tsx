"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Zone = {
  id: string;
  name: string;
  postalCodes: string[];
  feeCents: number;
  minOrderCents: number;
  isActive: boolean;
};

export function DeliveryZonesEditor({
  restaurantId,
  initial,
}: {
  restaurantId: string;
  initial: Zone[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [codes, setCodes] = useState("");
  const [fee, setFee] = useState("3.00");
  const [minOrder, setMinOrder] = useState("15.00");
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/delivery-zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        name,
        postalCodes: codes.split(/[,\s]+/).filter(Boolean),
        feeCents: Math.round(Number(fee.replace(",", ".")) * 100),
        minOrderCents: Math.round(Number(minOrder.replace(",", ".")) * 100),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setName("");
    setCodes("");
    router.refresh();
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/admin/delivery-zones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {initial.map((z) => (
        <div
          key={z.id}
          className="flex flex-wrap items-center justify-between gap-2 border border-[#c4a35a]/20 bg-[#12100e] p-3 text-sm"
        >
          <div>
            <p className="text-[#f0e6c8]">{z.name}</p>
            <p className="text-xs text-[#a89f8e]">
              {z.postalCodes.join(", ")} · {(z.feeCents / 100).toFixed(2)} € · min{" "}
              {(z.minOrderCents / 100).toFixed(2)} €
            </p>
          </div>
          <button
            type="button"
            className="text-xs text-[#c4a35a]"
            onClick={() => toggle(z.id, z.isActive)}
          >
            {z.isActive ? "Désactiver" : "Activer"}
          </button>
        </div>
      ))}
      <form onSubmit={create} className="grid gap-2 border border-[#c4a35a]/20 p-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom zone"
          className="border border-[#c4a35a]/25 bg-transparent px-3 py-2 text-sm"
          required
        />
        <input
          value={codes}
          onChange={(e) => setCodes(e.target.value)}
          placeholder="Codes postaux (74100, 74200)"
          className="border border-[#c4a35a]/25 bg-transparent px-3 py-2 text-sm"
          required
        />
        <input
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          placeholder="Frais €"
          className="border border-[#c4a35a]/25 bg-transparent px-3 py-2 text-sm"
        />
        <input
          value={minOrder}
          onChange={(e) => setMinOrder(e.target.value)}
          placeholder="Min €"
          className="border border-[#c4a35a]/25 bg-transparent px-3 py-2 text-sm"
        />
        <button type="submit" className="btn-gold sm:col-span-2">
          Ajouter zone
        </button>
      </form>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
