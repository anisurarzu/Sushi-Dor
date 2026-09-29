"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Cat = {
  id: string;
  nameFr: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
};

export function CategoryManager({ initial }: { initial: Cat[] }) {
  const router = useRouter();
  const [nameFr, setNameFr] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameFr }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setNameFr("");
    router.refresh();
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="flex flex-wrap gap-2">
        <input
          value={nameFr}
          onChange={(e) => setNameFr(e.target.value)}
          placeholder="Nouvelle catégorie"
          className="min-w-[200px] flex-1 border border-[#c4a35a]/25 bg-transparent px-3 py-2 text-sm"
          required
        />
        <button type="submit" className="btn-gold">
          Ajouter
        </button>
      </form>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div className="space-y-2">
        {initial.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 border border-[#c4a35a]/20 bg-[#12100e] px-4 py-3 text-sm"
          >
            <div>
              <p className="text-[#f0e6c8]">{c.nameFr}</p>
              <p className="text-xs text-[#a89f8e]">
                {c.slug} · {c.productCount} produit(s) · ordre {c.sortOrder}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggle(c.id, c.isActive)}
              className="text-xs text-[#c4a35a]"
            >
              {c.isActive ? "Archiver" : "Réactiver"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
