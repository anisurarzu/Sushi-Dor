"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatEuro } from "@/lib/pricing";
import { useCart } from "@/components/cart/CartProvider";

export type ProductDetail = {
  id: string;
  slug: string;
  nameFr: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  requiresCustomization: boolean;
  addonGroups: {
    id: string;
    nameFr: string;
    description: string | null;
    selectionType: "SINGLE" | "MULTIPLE";
    required: boolean;
    minSelections: number;
    maxSelections: number;
    addons: {
      id: string;
      nameFr: string;
      description: string | null;
      priceCents: number;
      allergens: string[];
    }[];
  }[];
};

type Props = {
  product: ProductDetail;
  initialAddonIds?: string[];
  initialQuantity?: number;
  cartItemId?: string;
  mode?: "add" | "edit";
};

export function ProductConfigurator({
  product,
  initialAddonIds = [],
  initialQuantity = 1,
  cartItemId,
  mode = "add",
}: Props) {
  const { addItem } = useCart();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initialAddonIds);
  const [qty, setQty] = useState(initialQuantity);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const addonPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of product.addonGroups) {
      for (const a of g.addons) map.set(a.id, a.priceCents);
    }
    return map;
  }, [product.addonGroups]);

  const addonsUnit = selected.reduce(
    (s, id) => s + (addonPriceMap.get(id) ?? 0),
    0,
  );
  const unit = product.priceCents + addonsUnit;
  const total = unit * qty;

  function toggleSingle(groupId: string, addonId: string) {
    const group = product.addonGroups.find((g) => g.id === groupId)!;
    const groupAddonIds = new Set(group.addons.map((a) => a.id));
    setSelected((prev) => [
      ...prev.filter((id) => !groupAddonIds.has(id)),
      addonId,
    ]);
    setError(null);
  }

  function toggleMulti(groupId: string, addonId: string) {
    const group = product.addonGroups.find((g) => g.id === groupId)!;
    const groupAddonIds = group.addons.map((a) => a.id);
    setSelected((prev) => {
      const isOn = prev.includes(addonId);
      if (isOn) return prev.filter((id) => id !== addonId);
      const countInGroup = prev.filter((id) => groupAddonIds.includes(id)).length;
      if (countInGroup >= group.maxSelections) {
        setError(
          `Vous pouvez sélectionner jusqu'à ${group.maxSelections} option(s) pour « ${group.nameFr} ».`,
        );
        return prev;
      }
      setError(null);
      return [...prev, addonId];
    });
  }

  function validateLocal(): string | null {
    for (const group of product.addonGroups) {
      const count = selected.filter((id) =>
        group.addons.some((a) => a.id === id),
      ).length;
      if (group.required && count < Math.max(1, group.minSelections)) {
        return `Veuillez choisir une option pour « ${group.nameFr} ».`;
      }
      if (count > group.maxSelections) {
        return `Vous pouvez sélectionner jusqu'à ${group.maxSelections} option(s) pour « ${group.nameFr} ».`;
      }
    }
    return null;
  }

  async function submit() {
    const localError = validateLocal();
    if (localError) {
      setError(localError);
      return;
    }
    setPending(true);
    setError(null);
    const result = await addItem({
      productId: product.id,
      quantity: qty,
      addonIds: selected,
      cartItemId,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setJustAdded(true);
    window.dispatchEvent(
      new CustomEvent("sd:cart-fly", {
        detail: {
          x: window.innerWidth / 2,
          y: window.innerHeight - 80,
        },
      }),
    );
    window.setTimeout(() => {
      router.push(mode === "edit" ? "/cart" : "/cart");
    }, 650);
  }

  return (
    <div className="relative pb-28 md:pb-0">
      <div className="space-y-8">
        {product.addonGroups.map((group) => (
          <fieldset key={group.id} className="border border-[color:var(--line)] p-4 sm:p-5">
            <legend className="px-1 text-[0.7rem] uppercase tracking-[0.16em] text-gold">
              {group.nameFr}
              {group.required ? " *" : ""}
            </legend>
            <ul className="mt-3 space-y-2">
              {group.addons.map((addon) => {
                const checked = selected.includes(addon.id);
                return (
                  <li key={addon.id}>
                    <label
                      className={`flex cursor-pointer items-start justify-between gap-3 border px-3 py-3 transition-colors ${
                        checked
                          ? "border-gold bg-gold/10"
                          : "border-transparent bg-ink-soft hover:border-[color:var(--line)]"
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        <input
                          type={
                            group.selectionType === "SINGLE" ? "radio" : "checkbox"
                          }
                          name={group.id}
                          checked={checked}
                          onChange={() =>
                            group.selectionType === "SINGLE"
                              ? toggleSingle(group.id, addon.id)
                              : toggleMulti(group.id, addon.id)
                          }
                          className="mt-1 accent-[var(--gold)]"
                        />
                        <span>
                          <span className="block text-sm text-champagne">
                            {addon.nameFr}
                          </span>
                          {addon.allergens.length > 0 ? (
                            <span className="mt-1 block text-xs text-mist">
                              Allergènes : {addon.allergens.join(", ")}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm text-gold">
                        {addon.priceCents === 0
                          ? "Gratuit"
                          : `+${formatEuro(addon.priceCents)}`}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}

        <div>
          <p className="mb-3 text-[0.7rem] uppercase tracking-[0.16em] text-gold">
            Quantité
          </p>
          <div className="inline-flex items-stretch overflow-hidden border border-[color:var(--line)] bg-ink-soft">
            <button
              type="button"
              className="cursor-pointer px-4 py-2.5 text-lg leading-none text-champagne transition-colors hover:bg-gold/10 hover:text-gold"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Diminuer"
            >
              −
            </button>
            <span className="flex min-w-12 items-center justify-center border-x border-[color:var(--line)] px-3 text-base font-medium tabular-nums text-bone">
              {qty}
            </span>
            <button
              type="button"
              className="cursor-pointer px-4 py-2.5 text-lg leading-none text-champagne transition-colors hover:bg-gold/10 hover:text-gold"
              onClick={() => setQty((q) => Math.min(20, q + 1))}
              aria-label="Augmenter"
            >
              +
            </button>
          </div>
        </div>

        <div className="hidden space-y-3 border border-[color:var(--line)] bg-ink-soft p-4 text-sm md:block">
          <div className="flex justify-between gap-4 text-[#c4bbaa]">
            <span>
              Sous-total ({formatEuro(product.priceCents)} × {qty})
            </span>
            <span className="tabular-nums text-bone">
              {formatEuro(product.priceCents * qty)}
            </span>
          </div>
          {addonsUnit > 0 ? (
            <div className="flex justify-between gap-4 text-[#c4bbaa]">
              <span>Options ({formatEuro(addonsUnit)} × {qty})</span>
              <span className="tabular-nums text-bone">
                {formatEuro(addonsUnit * qty)}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-t border-[color:var(--line)] pt-3 text-base text-champagne">
            <span className="font-medium">Total</span>
            <span className="tabular-nums text-gold">{formatEuro(total)}</span>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={submit}
          disabled={pending || justAdded}
          className={`btn-gold hidden w-full md:inline-flex ${justAdded ? "product-add-btn--success" : ""}`}
        >
          {pending
            ? "…"
            : justAdded
              ? "✓ Ajouté au panier"
              : mode === "edit"
                ? `Mettre à jour — ${formatEuro(total)}`
                : `Ajouter au panier — ${formatEuro(total)}`}
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--line)] bg-ink/95 p-3 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={submit}
          disabled={pending || justAdded}
          className={`btn-gold w-full ${justAdded ? "product-add-btn--success" : ""}`}
        >
          {pending
            ? "…"
            : justAdded
              ? "✓ Ajouté au panier"
              : mode === "edit"
                ? `Mettre à jour · ${formatEuro(total)}`
                : `Ajouter au panier · ${formatEuro(total)}`}
        </button>
      </div>
    </div>
  );
}
