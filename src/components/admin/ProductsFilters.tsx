"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminSelect } from "@/components/admin/AdminSelect";

type Props = {
  q: string;
  category: string;
  categories: { id: string; nameFr: string }[];
};

export function ProductsFilters({ q, category, categories }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(q);
  const [cat, setCat] = useState(category);

  function apply(nextCat?: string) {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    const c = nextCat ?? cat;
    if (c) params.set("category", c);
    const qs = params.toString();
    router.push(qs ? `/admin/products?${qs}` : "/admin/products");
  }

  return (
    <div className="grid gap-2 border border-[#c4a35a]/20 bg-[#12100e] p-3 sm:grid-cols-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") apply();
        }}
        placeholder="Rechercher…"
        className="border border-[#c4a35a]/25 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[#c4a35a] sm:col-span-2"
      />
      <AdminSelect
        aria-label="Catégorie"
        options={[
          { value: "", label: "Toutes catégories" },
          ...categories.map((c) => ({ value: c.id, label: c.nameFr })),
        ]}
        value={cat}
        onChange={(v) => {
          setCat(v);
          apply(v);
        }}
      />
      <button type="button" onClick={() => apply()} className="btn-gold text-[0.65rem]">
        Filtrer
      </button>
    </div>
  );
}
