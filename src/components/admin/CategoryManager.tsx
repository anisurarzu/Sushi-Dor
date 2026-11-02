"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BulkDeleteToolbar,
  DeleteListShell,
  RowCheckbox,
  RowDeleteButtons,
  useBulkDelete,
} from "@/components/admin/BulkDeleteControls";

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
  const [cats, setCats] = useState(initial);
  const [nameFr, setNameFr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    setCats(initial);
  }, [initial]);

  const bulk = useBulkDelete({
    resource: "categories",
    ids: cats.map((c) => c.id),
    label: "catégorie(s)",
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
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
    } catch {
      setError("Connexion interrompue.");
    } finally {
      setPending(false);
    }
  }

  async function toggle(id: string, isActive: boolean) {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Archivage impossible.");
        return;
      }
      setCats((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !isActive } : c)),
      );
      router.refresh();
    } catch {
      setError("Connexion interrompue.");
    } finally {
      setPending(false);
    }
  }

  function startEdit(c: Cat) {
    setEditingId(c.id);
    setEditName(c.nameFr);
    setEditDescription(c.description || "");
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  }

  async function saveEdit(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) {
      setError("Le nom est requis.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameFr: trimmed,
          description: editDescription.trim() || null,
          updateSlug: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Modification impossible.");
        return;
      }
      setCats((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                nameFr: data.category.nameFr,
                slug: data.category.slug,
                description: data.category.description,
              }
            : c,
        ),
      );
      cancelEdit();
      router.refresh();
    } catch {
      setError("Connexion interrompue.");
    } finally {
      setPending(false);
    }
  }

  async function persistOrder(next: Cat[]) {
    const previous = cats;
    setCats(next.map((c, i) => ({ ...c, sortOrder: i })));
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: next.map((c) => c.id) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCats(previous);
        setError(data.error || "Réordonnancement échoué.");
        return;
      }
      if (Array.isArray(data.categories)) {
        setCats((prev) => {
          const byId = new Map(prev.map((c) => [c.id, c]));
          return data.categories.map(
            (c: {
              id: string;
              nameFr: string;
              slug: string;
              description: string | null;
              sortOrder: number;
              isActive: boolean;
            }) => {
              const old = byId.get(c.id);
              return {
                ...c,
                productCount: old?.productCount ?? 0,
              };
            },
          );
        });
      }
      router.refresh();
    } catch {
      setCats(previous);
      setError("Connexion interrompue.");
    } finally {
      setPending(false);
    }
  }

  function onDropReorder(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const from = cats.findIndex((c) => c.id === dragId);
    const to = cats.findIndex((c) => c.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...cats];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void persistOrder(next);
    setDragId(null);
  }

  function move(id: string, dir: -1 | 1) {
    const index = cats.findIndex((c) => c.id === id);
    const target = index + dir;
    if (index < 0 || target < 0 || target >= cats.length) return;
    const next = [...cats];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    void persistOrder(next);
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
          disabled={pending}
        />
        <button type="submit" className="btn-gold" disabled={pending}>
          Ajouter
        </button>
      </form>
      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-[#a89f8e]">
        Glissez les catégories (⋮⋮) ou utilisez ↑ ↓ pour changer l&apos;ordre
        affiché sur le site.
      </p>

      {cats.length > 0 ? (
        <BulkDeleteToolbar
          allSelected={bulk.allSelected}
          toggleAll={bulk.toggleAll}
          selectedCount={bulk.selectedCount}
          pending={bulk.pending || pending}
          msg={bulk.msg}
          onSoft={() => void bulk.run("soft")}
          onHard={() => void bulk.run("hard")}
          idsCount={cats.length}
        />
      ) : null}

      <DeleteListShell pending={bulk.pending} skeletonCols={3}>
        <div className="space-y-2">
          {cats.map((c, index) => {
            const editing = editingId === c.id;
            return (
              <div
                key={c.id}
                draggable={!editing && !pending}
                onDragStart={() => setDragId(c.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDropReorder(c.id)}
                onDragEnd={() => setDragId(null)}
                className={`border border-[#c4a35a]/20 bg-[#12100e] px-3 py-3 text-sm transition-opacity sm:px-4 ${
                  dragId === c.id ? "opacity-60" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <button
                      type="button"
                      className="mt-0.5 cursor-grab select-none px-1 text-[#c4a35a]/80 active:cursor-grabbing"
                      aria-label="Déplacer"
                      title="Glisser pour réordonner"
                      disabled={pending || editing}
                    >
                      ⋮⋮
                    </button>
                    <RowCheckbox
                      checked={bulk.selected.has(c.id)}
                      onChange={() => bulk.toggle(c.id)}
                      disabled={bulk.pending || pending}
                    />
                    <div className="min-w-0 flex-1">
                      {editing ? (
                        <div className="space-y-2">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full border border-[#c4a35a]/35 bg-transparent px-2 py-1.5 text-sm text-[#f0e6c8]"
                            disabled={pending}
                          />
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Description (optionnel)"
                            rows={2}
                            className="w-full border border-[#c4a35a]/25 bg-transparent px-2 py-1.5 text-xs text-[#c4bbaa]"
                            disabled={pending}
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-[#f0e6c8]">{c.nameFr}</p>
                          <p className="text-xs text-[#a89f8e]">
                            {c.slug} · {c.productCount} produit(s) · #{index + 1}
                            {!c.isActive ? " · archivée" : ""}
                          </p>
                          {c.description ? (
                            <p className="mt-1 text-xs text-[#c4bbaa]">
                              {c.description}
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => move(c.id, -1)}
                      disabled={pending || index === 0 || editing}
                      className="border border-[#c4a35a]/25 px-2 py-1 text-xs text-[#c4a35a] disabled:opacity-40"
                      aria-label="Monter"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(c.id, 1)}
                      disabled={pending || index === cats.length - 1 || editing}
                      className="border border-[#c4a35a]/25 px-2 py-1 text-xs text-[#c4a35a] disabled:opacity-40"
                      aria-label="Descendre"
                    >
                      ↓
                    </button>
                    {editing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void saveEdit(c.id)}
                          disabled={pending}
                          className="btn-gold px-3 py-1 text-xs"
                        >
                          Enregistrer
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={pending}
                          className="text-xs text-[#a89f8e]"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        disabled={pending}
                        className="text-xs text-[#c4a35a]"
                      >
                        Modifier
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void toggle(c.id, c.isActive)}
                      disabled={pending || editing}
                      className="text-xs text-[#c4a35a]"
                    >
                      {c.isActive ? "Archiver" : "Réactiver"}
                    </button>
                    <RowDeleteButtons
                      id={c.id}
                      resource="categories"
                      label={c.nameFr}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DeleteListShell>
    </div>
  );
}
