"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { formatEuro } from "@/lib/pricing";

type ProductOpt = {
  id: string;
  nameFr: string;
  priceCents: number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryNameFr?: string;
  requiresCustomization?: boolean;
  isFree?: boolean;
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
  const [allProducts, setAllProducts] = useState<ProductOpt[]>([]);
  const [selected, setSelected] = useState<ProductOpt[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/categories/${categoryId}/addons`, {
          credentials: "include",
        });
        const text = await res.text();
        let data: Record<string, unknown> = {};
        try {
          data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
        } catch {
          if (!cancelled) {
            setError("Réponse serveur invalide. Rechargez la page admin.");
          }
          return;
        }
        if (cancelled) return;
        if (!res.ok) {
          setError(String(data.error || "Chargement impossible."));
          return;
        }
        setAllProducts((data.products as ProductOpt[]) || []);
        setSelected((data.selected as ProductOpt[]) || []);
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

  function openPicker() {
    setDraftIds(selected.map((p) => p.id));
    setSearch("");
    setPickerOpen(true);
  }

  function toggleDraft(id: string) {
    setDraftIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function applyPicker() {
    const byId = new Map(allProducts.map((p) => [p.id, p]));
    // Keep existing order + free flag for already selected, append new ones
    const kept = selected.filter((p) => draftIds.includes(p.id));
    const keptIds = new Set(kept.map((p) => p.id));
    const added = draftIds
      .filter((id) => !keptIds.has(id))
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((p) => ({ ...p!, isFree: false }));
    setSelected([...kept, ...added]);
    setPickerOpen(false);
  }

  function toggleFree(id: string) {
    setSelected((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFree: !p.isFree } : p)),
    );
  }

  function removeOne(id: string) {
    setSelected((prev) => prev.filter((p) => p.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    setSelected((prev) => {
      const i = prev.findIndex((p) => p.id === id);
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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selected.map((p) => ({
            productId: p.id,
            isFree: Boolean(p.isFree),
          })),
        }),
      });
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try {
        data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      } catch {
        setError("Réponse serveur invalide.");
        return;
      }
      if (!res.ok) {
        setError(String(data.error || "Enregistrement impossible."));
        return;
      }
      setMsg("Addons enregistrés.");
    } catch {
      setError("Connexion interrompue.");
    } finally {
      setPending(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter(
      (p) =>
        p.nameFr.toLowerCase().includes(q) ||
        (p.categoryNameFr || "").toLowerCase().includes(q),
    );
  }, [allProducts, search]);

  return (
    <div className="mt-3 border border-[#c4a35a]/30 bg-[#0c0a08] p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#c4a35a]">
            Addons catégorie
          </p>
          <p className="mt-1 text-sm text-[#f0e6c8]">{categoryName}</p>
          <p className="mt-1 text-xs text-[#a89f8e]">
            Ajoutez n&apos;importe quels produits du catalogue. Ils seront
            proposés en option au client.
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
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[0.65rem] uppercase tracking-[0.12em] text-[#c4a35a]">
              Sélectionnés ({selected.length})
            </p>
            <button
              type="button"
              onClick={openPicker}
              disabled={pending}
              className="border border-[#c4a35a]/55 bg-[#c4a35a]/12 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[#e0c878] hover:bg-[#c4a35a]/22"
            >
              + Ajouter un produit
            </button>
          </div>

          {selected.length === 0 ? (
            <p className="text-xs text-[#a89f8e]">
              Aucun addon pour l&apos;instant. Cliquez sur « Ajouter un produit ».
            </p>
          ) : (
            <ul className="space-y-1.5">
              {selected.map((p, i) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-2 border border-[#c4a35a]/20 px-2 py-1.5 text-xs"
                >
                  <span className="min-w-0 flex-1 truncate text-[#f0e6c8]">
                    {p.nameFr}
                    {p.categoryNameFr ? (
                      <span className="ml-2 text-[#a89f8e]">
                        · {p.categoryNameFr}
                      </span>
                    ) : null}
                    <span className="ml-2 text-[#c4a35a]">
                      {p.isFree ? "Gratuit" : formatEuro(p.priceCents)}
                    </span>
                  </span>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 border border-[#c4a35a]/25 px-2 py-1 text-[0.65rem] uppercase tracking-[0.1em] text-[#c4a35a]">
                    <input
                      type="checkbox"
                      checked={Boolean(p.isFree)}
                      disabled={pending}
                      onChange={() => toggleFree(p.id)}
                      className="accent-[#c4a35a]"
                    />
                    Free
                  </label>
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
                    disabled={i === selected.length - 1 || pending}
                    onClick={() => move(p.id, 1)}
                    aria-label="Descendre"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="px-1 text-[#a89f8e] hover:text-[#f0a39c]"
                    disabled={pending}
                    onClick={() => removeOne(p.id)}
                    aria-label="Retirer"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
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

      {mounted && pickerOpen
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0 border-0 bg-black/70"
                aria-label="Fermer"
                onClick={() => setPickerOpen(false)}
              />
              <div className="relative z-[1] flex max-h-[min(85vh,640px)] w-full max-w-lg flex-col border border-[#c4a35a]/35 bg-[#12100e] shadow-2xl">
                <div className="flex items-start justify-between gap-3 border-b border-[#c4a35a]/20 px-4 py-3">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#c4a35a]">
                      Ajouter des produits
                    </p>
                    <p className="mt-1 text-sm text-[#f0e6c8]">
                      Recherche & multi-sélection
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-[#a89f8e] hover:text-[#e0c878]"
                    onClick={() => setPickerOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="border-b border-[#c4a35a]/15 px-4 py-3">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un produit ou une catégorie…"
                    className="w-full border border-[#c4a35a]/30 bg-transparent px-3 py-2 text-sm text-[#f0e6c8] outline-none focus:border-[#c4a35a]"
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-[#a89f8e]">
                    {draftIds.length} sélectionné(s) · {filtered.length} résultat(s)
                  </p>
                </div>

                <ul className="flex-1 space-y-1 overflow-auto px-3 py-3">
                  {filtered.length === 0 ? (
                    <li className="px-1 py-6 text-center text-sm text-[#a89f8e]">
                      Aucun produit trouvé.
                    </li>
                  ) : (
                    filtered.map((p) => {
                      const on = draftIds.includes(p.id);
                      return (
                        <li key={p.id}>
                          <label
                            className={`flex cursor-pointer items-center gap-3 border px-2.5 py-2 text-xs transition-colors ${
                              on
                                ? "border-[#c4a35a]/60 bg-[#c4a35a]/10 text-[#f0e6c8]"
                                : "border-[#c4a35a]/15 text-[#c4bbaa] hover:border-[#c4a35a]/35"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggleDraft(p.id)}
                              className="accent-[#c4a35a]"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">{p.nameFr}</span>
                              <span className="mt-0.5 block text-[0.65rem] text-[#a89f8e]">
                                {p.categoryNameFr || "—"}
                                {!p.isAvailable ? " · indisponible" : ""}
                              </span>
                            </span>
                            <span className="shrink-0 text-[#c4a35a]">
                              {formatEuro(p.priceCents)}
                            </span>
                          </label>
                        </li>
                      );
                    })
                  )}
                </ul>

                <div className="flex flex-wrap gap-2 border-t border-[#c4a35a]/20 px-4 py-3">
                  <button
                    type="button"
                    className="btn-gold px-3 py-1.5 text-xs"
                    onClick={applyPicker}
                  >
                    Valider la sélection
                  </button>
                  <button
                    type="button"
                    className="border border-[#c4a35a]/30 px-3 py-1.5 text-xs text-[#a89f8e]"
                    onClick={() => setPickerOpen(false)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
