"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Restaurant = {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string | null;
  email: string | null;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  reservationEnabled: boolean;
  isActive: boolean;
  deliveryFeeCents: number;
  minOrderCents: number;
};

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  const [r, setR] = useState(restaurant);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fee, setFee] = useState((r.deliveryFeeCents / 100).toFixed(2));
  const [minOrder, setMinOrder] = useState((r.minOrderCents / 100).toFixed(2));

  async function save() {
    setPending(true);
    setError(null);
    setSuccess(null);
    const res = await fetch(`/api/admin/restaurants/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: r.name,
        address: r.address,
        postalCode: r.postalCode,
        city: r.city,
        phone: r.phone,
        email: r.email,
        deliveryEnabled: r.deliveryEnabled,
        pickupEnabled: r.pickupEnabled,
        reservationEnabled: r.reservationEnabled,
        isActive: r.isActive,
        deliveryFeeCents: Math.round(Number(fee.replace(",", ".")) * 100) || 0,
        minOrderCents:
          Math.round(Number(minOrder.replace(",", ".")) * 100) || 0,
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setR(data.restaurant);
    setSuccess("Restaurant mis à jour.");
    router.refresh();
  }

  async function archive() {
    if (!confirm("Archiver ce restaurant ?")) return;
    const res = await fetch(`/api/admin/restaurants/${r.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    if (data.restaurant) setR(data.restaurant);
    setSuccess(data.message || "Archivé.");
    router.refresh();
  }

  return (
    <article className="space-y-3 border border-[#c4a35a]/20 bg-[#12100e] p-4 text-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          Nom
          <input
            value={r.name}
            onChange={(e) => setR({ ...r, name: e.target.value })}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
        <label>
          Téléphone
          <input
            value={r.phone || ""}
            onChange={(e) => setR({ ...r, phone: e.target.value || null })}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
        <label className="sm:col-span-2">
          Adresse
          <input
            value={r.address}
            onChange={(e) => setR({ ...r, address: e.target.value })}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
        <label>
          Code postal
          <input
            value={r.postalCode}
            onChange={(e) => setR({ ...r, postalCode: e.target.value })}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
        <label>
          Ville
          <input
            value={r.city}
            onChange={(e) => setR({ ...r, city: e.target.value })}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
        <label>
          Email
          <input
            value={r.email || ""}
            onChange={(e) => setR({ ...r, email: e.target.value || null })}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
        <label>
          Frais livraison (€)
          <input
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
        <label>
          Minimum commande (€)
          <input
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={r.deliveryEnabled}
            onChange={(e) =>
              setR({ ...r, deliveryEnabled: e.target.checked })
            }
          />
          Livraison
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={r.pickupEnabled}
            onChange={(e) => setR({ ...r, pickupEnabled: e.target.checked })}
          />
          Emporter
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={r.reservationEnabled}
            onChange={(e) =>
              setR({ ...r, reservationEnabled: e.target.checked })
            }
          />
          Réservations
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={r.isActive}
            onChange={(e) => setR({ ...r, isActive: e.target.checked })}
          />
          Actif
        </label>
      </div>
      {error ? <p className="text-red-300">{error}</p> : null}
      {success ? <p className="text-emerald-300">{success}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void save()}
          className="btn-gold"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => void archive()}
          className="border border-red-400/40 px-3 py-2 text-red-300"
        >
          Archiver
        </button>
      </div>
    </article>
  );
}

export function RestaurantManager({
  initial,
}: {
  initial: Restaurant[];
}) {
  return (
    <div className="space-y-4">
      {initial.map((r) => (
        <RestaurantCard key={r.id} restaurant={r} />
      ))}
    </div>
  );
}
