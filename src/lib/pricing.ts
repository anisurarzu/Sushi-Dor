import { createHash } from "crypto";
import type { AddonSelectionType } from "@prisma/client";

export type SelectedAddonInput = {
  addonId: string;
};

export type PricedAddon = {
  addonId: string;
  nameFr: string;
  priceCents: number;
  groupId: string;
};

export type PricedLine = {
  productId: string;
  productNameFr: string;
  basePriceCents: number;
  quantity: number;
  addons: PricedAddon[];
  addonsUnitCents: number;
  unitPriceCents: number;
  lineTotalCents: number;
  configSignature: string;
  productsSubtotalCents: number;
  addonsSubtotalCents: number;
};

export type AddonGroupForPricing = {
  id: string;
  nameFr: string;
  selectionType: AddonSelectionType;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  isActive: boolean;
  addons: {
    id: string;
    nameFr: string;
    priceCents: number;
    isActive: boolean;
  }[];
};

export type ProductForPricing = {
  id: string;
  nameFr: string;
  priceCents: number;
  isAvailable: boolean;
  addonGroups: AddonGroupForPricing[];
};

export class PricingError extends Error {
  constructor(
    message: string,
    public code:
      | "PRODUCT_UNAVAILABLE"
      | "ADDON_INVALID"
      | "ADDON_REQUIRED"
      | "ADDON_MIN"
      | "ADDON_MAX"
      | "QUANTITY_INVALID",
  ) {
    super(message);
    this.name = "PricingError";
  }
}

export function buildConfigSignature(
  productId: string,
  addonIds: string[],
): string {
  const normalized = [...addonIds].sort().join(",");
  return createHash("sha256")
    .update(`${productId}|${normalized}`)
    .digest("hex")
    .slice(0, 32);
}

export function priceProductLine(
  product: ProductForPricing,
  selectedAddonIds: string[],
  quantity: number,
  maxQuantity = 20,
): PricedLine {
  if (!product.isAvailable) {
    throw new PricingError(
      "Ce produit n'est plus disponible.",
      "PRODUCT_UNAVAILABLE",
    );
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity) {
    throw new PricingError(
      `La quantité doit être entre 1 et ${maxQuantity}.`,
      "QUANTITY_INVALID",
    );
  }

  const uniqueSelected = [...new Set(selectedAddonIds)];
  const activeGroups = product.addonGroups.filter((g) => g.isActive);
  const addonById = new Map(
    activeGroups.flatMap((g) =>
      g.addons.filter((a) => a.isActive).map((a) => [a.id, { ...a, groupId: g.id }]),
    ),
  );

  for (const id of uniqueSelected) {
    if (!addonById.has(id)) {
      throw new PricingError(
        "Une option sélectionnée n'est plus disponible.",
        "ADDON_INVALID",
      );
    }
  }

  for (const group of activeGroups) {
    const selectedInGroup = uniqueSelected.filter((id) =>
      group.addons.some((a) => a.id === id && a.isActive),
    );
    const count = selectedInGroup.length;

    if (group.selectionType === "SINGLE" && count > 1) {
      throw new PricingError(
        `Veuillez choisir une seule option pour « ${group.nameFr} ».`,
        "ADDON_MAX",
      );
    }
    if (group.required && count < Math.max(1, group.minSelections)) {
      throw new PricingError(
        `Veuillez choisir une option pour « ${group.nameFr} ».`,
        "ADDON_REQUIRED",
      );
    }
    if (!group.required && group.minSelections > 0 && count < group.minSelections) {
      throw new PricingError(
        `Veuillez sélectionner au moins ${group.minSelections} option(s) pour « ${group.nameFr} ».`,
        "ADDON_MIN",
      );
    }
    if (count > group.maxSelections) {
      throw new PricingError(
        `Vous pouvez sélectionner jusqu'à ${group.maxSelections} option(s) pour « ${group.nameFr} ».`,
        "ADDON_MAX",
      );
    }
  }

  const pricedAddons: PricedAddon[] = uniqueSelected.map((id) => {
    const a = addonById.get(id)!;
    return {
      addonId: a.id,
      nameFr: a.nameFr,
      priceCents: a.priceCents,
      groupId: a.groupId,
    };
  });

  const addonsUnitCents = pricedAddons.reduce((s, a) => s + a.priceCents, 0);
  const unitPriceCents = product.priceCents + addonsUnitCents;
  const productsSubtotalCents = product.priceCents * quantity;
  const addonsSubtotalCents = addonsUnitCents * quantity;
  const lineTotalCents = unitPriceCents * quantity;

  return {
    productId: product.id,
    productNameFr: product.nameFr,
    basePriceCents: product.priceCents,
    quantity,
    addons: pricedAddons,
    addonsUnitCents,
    unitPriceCents,
    lineTotalCents,
    configSignature: buildConfigSignature(product.id, uniqueSelected),
    productsSubtotalCents,
    addonsSubtotalCents,
  };
}

export function formatEuro(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
