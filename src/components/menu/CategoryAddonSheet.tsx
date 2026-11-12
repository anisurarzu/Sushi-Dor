"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatEuro } from "@/lib/pricing";
import type { CategoryAddonOffer } from "@/lib/category-addons";

type Props = {
  open: boolean;
  mainName: string;
  mainPriceCents: number;
  offers: CategoryAddonOffer[];
  pending?: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
};

export function CategoryAddonSheet({
  open,
  mainName,
  mainPriceCents,
  offers,
  pending = false,
  onClose,
  onConfirm,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setSelected([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, onClose]);

  if (!mounted || !open) return null;

  const extras = offers
    .filter((o) => selected.includes(o.id))
    .reduce((s, o) => s + o.priceCents, 0);
  const total = mainPriceCents + extras;

  return createPortal(
    <div className="category-addon-sheet" role="dialog" aria-modal="true">
      <button
        type="button"
        className="category-addon-sheet__backdrop"
        aria-label="Fermer"
        disabled={pending}
        onClick={onClose}
      />
      <aside className="category-addon-sheet__panel">
        <div className="category-addon-sheet__head">
          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.18em] text-gold">
              Options suggérées
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-champagne">
              Ajoutez un extra ?
            </h2>
            <p className="mt-1 text-sm text-mist">
              Pour <span className="text-bone">{mainName}</span> — facultatif
            </p>
          </div>
          <button
            type="button"
            className="category-addon-sheet__close"
            disabled={pending}
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <ul className="category-addon-sheet__list">
          {offers.map((offer) => {
            const checked = selected.includes(offer.id);
            if (offer.requiresCustomization) {
              return (
                <li key={offer.id} className="category-addon-sheet__row">
                  <div className="category-addon-sheet__thumb">
                    {offer.imageUrl ? (
                      <Image
                        src={offer.imageUrl}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <span>SD</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-bone">{offer.nameFr}</p>
                    <p className="text-xs text-gold">
                      {formatEuro(offer.priceCents)}
                    </p>
                    <Link
                      href={`/menu/${offer.slug}`}
                      className="mt-1 inline-block text-[0.62rem] uppercase tracking-[0.12em] text-mist underline hover:text-gold"
                    >
                      Personnaliser
                    </Link>
                  </div>
                </li>
              );
            }
            return (
              <li key={offer.id}>
                <label
                  className={`category-addon-sheet__row is-selectable ${checked ? "is-checked" : ""}`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    disabled={pending}
                    onChange={() =>
                      setSelected((prev) =>
                        checked
                          ? prev.filter((id) => id !== offer.id)
                          : [...prev, offer.id],
                      )
                    }
                  />
                  <div className="category-addon-sheet__thumb">
                    {offer.imageUrl ? (
                      <Image
                        src={offer.imageUrl}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <span>SD</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-bone">{offer.nameFr}</p>
                    <p className="text-xs text-gold">
                      {formatEuro(offer.priceCents)}
                    </p>
                  </div>
                  <span className="category-addon-sheet__check" aria-hidden>
                    {checked ? "✓" : "+"}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="category-addon-sheet__foot">
          <div className="mb-3 flex justify-between text-sm">
            <span className="text-mist">Total ligne</span>
            <span className="tabular-nums text-gold">{formatEuro(total)}</span>
          </div>
          <button
            type="button"
            className="btn-gold w-full"
            disabled={pending}
            onClick={() => onConfirm(selected)}
          >
            {pending
              ? "Ajout en cours…"
              : selected.length > 0
                ? `Ajouter avec extras`
                : `Ajouter sans extra`}
          </button>
          <button
            type="button"
            className="mt-2 w-full text-center text-[0.65rem] uppercase tracking-[0.14em] text-mist hover:text-champagne"
            disabled={pending}
            onClick={() => onConfirm([])}
          >
            Continuer sans addon
          </button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
