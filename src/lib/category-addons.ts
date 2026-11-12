/** Above this count, admin sets Free; at/below, guest may pick 1 free addon. */
export const CATEGORY_ADDON_ADMIN_FREE_MIN = 4;

export type CategoryAddonOffer = {
  id: string;
  slug: string;
  nameFr: string;
  priceCents: number;
  imageUrl: string | null;
  requiresCustomization: boolean;
  isFree: boolean;
};

export function categoryAddonGuestPicksFree(count: number) {
  return count > 0 && count < CATEGORY_ADDON_ADMIN_FREE_MIN;
}

export function mapCategoryAddonProduct(row: {
  isFree?: boolean;
  product: {
    id: string;
    slug: string;
    nameFr: string;
    priceCents: number;
    imageUrl: string | null;
    isAvailable: boolean;
    deletedStatus: number;
    addonGroups?: { id: string }[];
  } | null;
}): CategoryAddonOffer | null {
  const p = row.product;
  if (!p || !p.isAvailable || p.deletedStatus === 255) return null;
  return {
    id: p.id,
    slug: p.slug,
    nameFr: p.nameFr,
    priceCents: p.priceCents,
    imageUrl: p.imageUrl,
    requiresCustomization: (p.addonGroups?.length ?? 0) > 0,
    isFree: Boolean(row.isFree),
  };
}

export const categoryAddonInclude = {
  where: { isActive: true },
  orderBy: { sortOrder: "asc" as const },
  include: {
    product: {
      include: {
        addonGroups: {
          where: { isActive: true, required: true },
          select: { id: true },
        },
      },
    },
  },
} as const;
