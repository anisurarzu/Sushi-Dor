"use client";

import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { CategoryAddonSheet } from "@/components/menu/CategoryAddonSheet";
import type { CategoryAddonOffer } from "@/lib/category-addons";

type Props = {
  productId: string;
  slug: string;
  nameFr?: string;
  priceCents?: number;
  requiresCustomization: boolean;
  imageUrl?: string | null;
  categoryAddons?: CategoryAddonOffer[];
};

export function ProductAddButton({
  productId,
  slug,
  nameFr = "Produit",
  priceCents = 0,
  requiresCustomization,
  imageUrl,
  categoryAddons = [],
}: Props) {
  const { addItem } = useCart();
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const offers = categoryAddons.filter((a) => a.id !== productId);

  if (requiresCustomization) {
    return (
      <Link
        href={`/menu/${slug}`}
        className="product-add-btn product-add-btn--ghost mt-auto pt-3"
      >
        <span>Personnaliser</span>
        <svg
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          aria-hidden
        >
          <path
            d="M3 8h10M9 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    );
  }

  function flyFrom(el?: HTMLElement | null) {
    const rect = (el || btnRef.current)?.getBoundingClientRect();
    window.dispatchEvent(
      new CustomEvent("sd:cart-fly", {
        detail: {
          x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
          y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
          imageUrl: imageUrl || null,
        },
      }),
    );
  }

  async function addProducts(
    entries: { id: string; asFree?: boolean }[],
  ) {
    setPending(true);
    setError(null);
    try {
      for (const entry of entries) {
        const result = await addItem({
          productId: entry.id,
          quantity: 1,
          addonIds: [],
          asFree: entry.asFree,
        });
        if (!result.ok) {
          setError(result.error);
          return false;
        }
      }
      setAdded(true);
      flyFrom();
      window.setTimeout(() => setAdded(false), 1800);
      return true;
    } catch {
      setError("Connexion interrompue. Réessayez.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function onAdd(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending || added) return;
    if (offers.length > 0) {
      setSheetOpen(true);
      return;
    }
    await addProducts([{ id: productId }]);
  }

  async function onConfirmExtras(selectedIds: string[]) {
    const extras = selectedIds.map((id) => {
      const offer = offers.find((o) => o.id === id);
      return { id, asFree: Boolean(offer?.isFree) };
    });
    const ok = await addProducts([{ id: productId }, ...extras]);
    if (ok) setSheetOpen(false);
  }

  return (
    <div className="mt-auto pt-3">
      <button
        ref={btnRef}
        type="button"
        onClick={onAdd}
        disabled={pending}
        className={`product-add-btn w-full ${added ? "product-add-btn--success" : ""}`}
        aria-live="polite"
      >
        {pending ? (
          <>
            <span className="product-add-spinner" aria-hidden />
            <span>Ajout en cours…</span>
          </>
        ) : added ? (
          <>
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
              <path
                d="M3 8.5l3.2 3.2L13 4.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="product-add-check"
              />
            </svg>
            <span>Ajouté</span>
          </>
        ) : (
          <>
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
              <path
                d="M8 3v10M3 8h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>{offers.length > 0 ? "Ajouter +" : "Ajouter"}</span>
          </>
        )}
      </button>
      {error ? (
        <p className="mt-1.5 text-[0.65rem] text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      <CategoryAddonSheet
        open={sheetOpen}
        mainName={nameFr}
        mainPriceCents={priceCents}
        offers={offers}
        pending={pending}
        onClose={() => setSheetOpen(false)}
        onConfirm={(ids) => void onConfirmExtras(ids)}
      />
    </div>
  );
}
