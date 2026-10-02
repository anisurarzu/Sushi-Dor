"use client";

import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";
import { useCart } from "@/components/cart/CartProvider";

type Props = {
  productId: string;
  slug: string;
  requiresCustomization: boolean;
};

export function ProductAddButton({
  productId,
  slug,
  requiresCustomization,
}: Props) {
  const { addItem } = useCart();
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

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

  async function onAdd(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending || added) return;
    setPending(true);
    setError(null);
    const result = await addItem({
      productId,
      quantity: 1,
      addonIds: [],
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAdded(true);
    const rect = btnRef.current?.getBoundingClientRect();
    window.dispatchEvent(
      new CustomEvent("sd:cart-fly", {
        detail: {
          x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
          y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
        },
      }),
    );
    window.setTimeout(() => setAdded(false), 1600);
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
            <span>Ajout…</span>
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
            <span>Ajouter</span>
          </>
        )}
      </button>
      {error ? (
        <p className="mt-1.5 text-[0.65rem] text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
