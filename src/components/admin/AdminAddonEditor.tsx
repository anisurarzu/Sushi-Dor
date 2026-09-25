"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatEuro } from "@/lib/pricing";

type Group = {
  id: string;
  nameFr: string;
  selectionType: "SINGLE" | "MULTIPLE";
  required: boolean;
  minSelections: number;
  maxSelections: number;
  isActive: boolean;
  addons: {
    id: string;
    nameFr: string;
    priceCents: number;
    isActive: boolean;
  }[];
};

export function AdminAddonEditor({
  productId,
  initialGroups,
}: {
  productId: string;
  initialGroups: Group[];
}) {
  const router = useRouter();
  const [groups] = useState(initialGroups);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function createGroup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/products/${productId}/addon-groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameFr: fd.get("nameFr"),
        selectionType: fd.get("selectionType"),
        required: fd.get("required") === "on",
        minSelections: Number(fd.get("minSelections") || 0),
        maxSelections: Number(fd.get("maxSelections") || 1),
      }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error || "Erreur");
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  async function createAddon(groupId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/addon-groups/${groupId}/addons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameFr: fd.get("nameFr"),
        priceCents: Math.round(Number(fd.get("priceEuro") || 0) * 100),
      }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error || "Erreur");
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-8">
      {groups.map((g) => (
        <section key={g.id} className="border border-[color:var(--line)] p-4">
          <h2 className="text-champagne">
            {g.nameFr}{" "}
            <span className="text-sm text-mist">
              ({g.selectionType}
              {g.required ? ", obligatoire" : ""})
            </span>
          </h2>
          <ul className="mt-3 space-y-1 text-sm">
            {g.addons.map((a) => (
              <li key={a.id} className="flex justify-between text-mist">
                <span>{a.nameFr}</span>
                <span className="text-gold">{formatEuro(a.priceCents)}</span>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => createAddon(g.id, e)}
            className="mt-4 grid gap-2 sm:grid-cols-[1fr_120px_auto]"
          >
            <input
              name="nameFr"
              required
              placeholder="Nouvelle option"
              className="border border-[color:var(--line)] bg-transparent px-3 py-2 text-sm"
            />
            <input
              name="priceEuro"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
              className="border border-[color:var(--line)] bg-transparent px-3 py-2 text-sm"
            />
            <button type="submit" disabled={pending} className="btn-ghost">
              Ajouter
            </button>
          </form>
        </section>
      ))}

      <form
        onSubmit={createGroup}
        className="space-y-3 border border-[color:var(--line)] p-4"
      >
        <h2 className="text-champagne">Nouveau groupe d&apos;options</h2>
        <input
          name="nameFr"
          required
          placeholder="Nom du groupe"
          className="w-full border border-[color:var(--line)] bg-transparent px-3 py-2 text-sm"
        />
        <select
          name="selectionType"
          className="w-full border border-[color:var(--line)] bg-ink px-3 py-2 text-sm"
          defaultValue="SINGLE"
        >
          <option value="SINGLE">SINGLE</option>
          <option value="MULTIPLE">MULTIPLE</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-mist">
          <input type="checkbox" name="required" /> Obligatoire
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            name="minSelections"
            type="number"
            min={0}
            defaultValue={0}
            className="border border-[color:var(--line)] bg-transparent px-3 py-2 text-sm"
            placeholder="Min"
          />
          <input
            name="maxSelections"
            type="number"
            min={1}
            defaultValue={1}
            className="border border-[color:var(--line)] bg-transparent px-3 py-2 text-sm"
            placeholder="Max"
          />
        </div>
        <button type="submit" disabled={pending} className="btn-gold">
          Créer le groupe
        </button>
      </form>
      {message ? <p className="text-sm text-red-300">{message}</p> : null}
    </div>
  );
}
