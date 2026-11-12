"use client";

import { useEffect, useState } from "react";
import { formatEuro } from "@/lib/pricing";

type ProductOpt = {
  id: string;
  nameFr: string;
  priceCents: number;
  imageUrl: string | null;
  isAvailable: boolean;
  requiresCustomization: boolean;
};

type Props = {
  categoryId: string;
  categoryName: string;
  onClose: () => void;
};

export function CategoryAddonEditor({
  categoryId,
  categoryName,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductOpt[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/categories/${categoryId}/addons`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Chargement impossible.");
          return;
        }
        setProducts(data.products || []);
        setSelected(data.selectedProductIds || []);
      } catch {
        if (!cancelled) setError("Connexion interrompue.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function move(id: string, dir: -1 | 1) {
    setSelected((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(i, 1);
      next.splice(j, 0, item);
      return next;
    });
  }

  async function save() {
    setPending(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}/addons`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Enregistrement impossible.");
        return;
      }
      setMsg("Addons enregistrés.");
    } catch {
      setError("Connexion interrompue.");
    } finally {
      setPending(false);
    }
  }

  const byId = new Map(products.map((p) => [p.id, p]));
  const selectedProducts = selected
    .map((id) => byId.get(id))
    .filter(Boolean) as ProductOpt[];
  const available = products.filter((p) => !selected.includes(p.id));

  return (
    <div className="mt-3 border border-[#c4a35a]/30 bg-[#0c0a08] p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#c4a35a]">
            Addons catégorie
          </p>
          <p className="mt-1 text-sm text-[#f0e6c8]">{categoryName}</p>
          <p className="mt-1 text-xs text-[#a89f8e]">
            Choisissez des produits de cette catégorie proposés en option quand
            le client ajoute un article.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[0.65rem] uppercase tracking-[0.14em] text-[#a89f8e] hover:text-[#e0c878]"
        >
          Fermer
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#a89f8e]">Chargement…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-[0.65rem] uppercase tracking-[0.12em] text-[#c4a35a]">
              Sélectionnés ({selectedProducts.length})
            </p>
            {selectedProducts.length === 0 ? (
              <p className="text-xs text-[#a89f8e]">Aucun addon pour l&apos;instant.</p>
            ) : (
              <ul className="space-y-1.5">
                {selectedProducts.map((p, i) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 border border-[#c4a35a]/20 px-2 py-1.5 text-xs"
                  >
                    <span className="min-w-0 flex-1 truncate text-[#f0e6c8]">
                      {p.nameFr}
                      <span className="ml-2 text-[#c4a35a]">
                        {formatEuro(p.priceCents)}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="px-1 text-[#a89f8e] hover:text-[#e0c878] disabled:opacity-30"
                      disabled={i === 0 || pending}
                      onClick={() => move(p.id, -1)}
                      aria-label="Monter"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="px-1 text-[#a89f8e] hover:text-[#e0c878] disabled:opacity-30"
                      disabled={i === selectedProducts.length - 1 || pending}
                      onClick={() => move(p.id, 1)}
                      aria-label="Descendre"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="px-1 text-[#a89f8e] hover:text-[#f0a39c]"
                      disabled={pending}
                      onClick={() => toggle(p.id)}
                      aria-label="Retirer"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-2 text-[0.65rem] uppercase tracking-[0.12em] text-[#c4a35a]">
              Produits de la catégorie
            </p>
            {available.length === 0 ? (
              <p className="text-xs text-[#a89f8e]">
                Tous les produits sont déjà sélectionnés, ou la catégorie est vide.
              </p>
            ) : (
              <ul className="max-h-56 space-y-1 overflow-auto pr-1">
                {available.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={pending || !p.isAvailable}
                      onClick={() => toggle(p.id)}
                      className="flex w-full items-center justify-between gap-2 border border-[#c4a35a]/15 px-2 py-1.5 text-left text-xs text-[#c4bbaa] hover:border-[#c4a35a]/45 hover:text-[#f0e6c8] disabled:opacity-40"
                    >
                      <span className="truncate">
                        {p.nameFr}
                        {p.requiresCustomization ? (
                          <span className="ml-1 text-[0.55rem] uppercase tracking-[0.1em] text-[#c4a35a]">
                            perso.
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-[#c4a35a]">
                        {formatEuro(p.priceCents)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {error ? (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      {msg ? <p className="mt-3 text-sm text-[#e0c878]">{msg}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-gold px-3 py-1.5 text-xs"
          disabled={pending || loading}
          onClick={() => void save()}
        >
          {pending ? "Enregistrement…" : "Enregistrer les addons"}
        </button>
      </div>
    </div>
  );
}
