import menuJson from "@/data/menu.json";
import type { MenuData } from "@/lib/menu";

export type CatalogProduct = {
  id: string;
  slug: string;
  nameFr: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  requiresCustomization: boolean;
  categorySlug?: string;
  categoryNameFr?: string;
};

export type CatalogCategory = {
  slug: string;
  nameFr: string;
  products: CatalogProduct[];
};

const staticMenu = menuJson as MenuData;

/** Offline / no-DB catalog from the imported menu file. */
export function getStaticCatalog(): {
  products: CatalogProduct[];
  categories: CatalogCategory[];
} {
  const products: CatalogProduct[] = staticMenu.products.map((p) => ({
    id: `static-${p.slug}`,
    slug: p.slug,
    nameFr: p.nameFr,
    description: p.description,
    priceCents: p.priceCents,
    imageUrl: p.imageUrl,
    requiresCustomization: false,
    categorySlug: p.categorySlug,
  }));

  const categories: CatalogCategory[] = staticMenu.categories.map((c) => ({
    slug: c.slug,
    nameFr: c.nameFr,
    products: products.filter((p) => p.categorySlug === c.slug),
  }));

  return { products, categories };
}
