"use client";

import { useState } from "react";

type Props = {
  productId: string;
  initial: {
    isFeatured: boolean;
    featuredOrder: number;
    isNew: boolean;
    isPopular: boolean;
    isVegetarian: boolean;
    isVegan: boolean;
    isSpicy: boolean;
    shortDescription: string | null;
    isAvailable: boolean;
  };
};

export function AdminProductFlags({ productId, initial }: Props) {
  const [state, setState] = useState(initial);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setStatus(null);
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus(data.error || "Erreur de sauvegarde");
      return;
    }
    setStatus("Enregistré");
  }

  return (
    <form
      onSubmit={save}
      className="mt-8 space-y-4 border border-[color:var(--line)] p-4 sm:p-5"
    >
      <h2 className="text-[0.7rem] uppercase tracking-[0.16em] text-gold">
        Accueil & badges
      </h2>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={state.isFeatured}
          onChange={(e) =>
            setState((s) => ({ ...s, isFeatured: e.target.checked }))
          }
          className="accent-[var(--gold)]"
        />
        Incontournable (featured)
      </label>
      <label className="block text-sm">
        <span className="text-[#c4bbaa]">Ordre featured</span>
        <input
          type="number"
          min={0}
          value={state.featuredOrder}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              featuredOrder: Number(e.target.value) || 0,
            }))
          }
          className="mt-1 w-full border border-[color:var(--line)] bg-ink-soft px-3 py-2 text-bone"
        />
      </label>
      <label className="block text-sm">
        <span className="text-[#c4bbaa]">Description courte</span>
        <input
          type="text"
          value={state.shortDescription ?? ""}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              shortDescription: e.target.value || null,
            }))
          }
          className="mt-1 w-full border border-[color:var(--line)] bg-ink-soft px-3 py-2 text-bone"
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            ["isNew", "Nouveau"],
            ["isPopular", "Populaire"],
            ["isVegetarian", "Végétarien"],
            ["isVegan", "Vegan"],
            ["isSpicy", "Épicé"],
            ["isAvailable", "Disponible"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={state[key]}
              onChange={(e) =>
                setState((s) => ({ ...s, [key]: e.target.checked }))
              }
              className="accent-[var(--gold)]"
            />
            {label}
          </label>
        ))}
      </div>
      <button type="submit" disabled={pending} className="btn-gold">
        {pending ? "…" : "Enregistrer"}
      </button>
      {status ? <p className="text-sm text-gold">{status}</p> : null}
    </form>
  );
}
