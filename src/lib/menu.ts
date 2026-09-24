export type MenuProduct = {
  sku: string;
  slug: string;
  nameFr: string;
  description: string | null;
  priceCents: number;
  categorySlug: string;
  imageUrl: string;
  sortOrder: number;
};

export type MenuCategory = {
  slug: string;
  nameFr: string;
  sortOrder: number;
  imageUrl: string;
};

export type MenuData = {
  restaurant: {
    name: string;
    city: string;
    region: string;
    area: string;
    country: string;
  };
  categories: MenuCategory[];
  products: MenuProduct[];
};

import menuJson from "@/data/menu.json";

export const menuData = menuJson as MenuData;

export function formatEuro(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function getFeaturedProducts(limit = 8) {
  const featuredSkus = ["23", "86", "118", "119", "120", "60", "90", "110"];
  const picked = featuredSkus
    .map((sku) => menuData.products.find((p) => p.sku === sku))
    .filter(Boolean) as MenuProduct[];
  if (picked.length >= limit) return picked.slice(0, limit);
  return menuData.products.slice(0, limit);
}

export function getProductsByCategory(slug: string) {
  return menuData.products.filter((p) => p.categorySlug === slug);
}

export function getProductBySlug(slug: string) {
  return menuData.products.find((p) => p.slug === slug);
}

export function getCategoryBySlug(slug: string) {
  return menuData.categories.find((c) => c.slug === slug);
}
