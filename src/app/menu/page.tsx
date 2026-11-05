import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { MenuCatalogClient } from "@/components/menu/MenuCatalogClient";
import { getStaticCatalog } from "@/lib/catalog-static";
import type { HomeProduct } from "@/lib/home-catalog";
import { dbAvailable, prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "La carte · Sushi D'or",
  description:
    "Carte Sushi D'or à Annemasse — sushis, makis, spécialités et menus.",
};

function toCard(item: {
  id: string;
  slug: string;
  nameFr: string;
  description: string | null;
  shortDescription?: string | null;
  priceCents: number;
  imageUrl: string | null;
  isFeatured?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isSpicy?: boolean;
  requiresCustomization: boolean;
}): HomeProduct {
  return {
    id: item.id,
    slug: item.slug,
    nameFr: item.nameFr,
    description: item.description,
    shortDescription: item.shortDescription ?? item.description,
    priceCents: item.priceCents,
    imageUrl: item.imageUrl,
    requiresCustomization: item.requiresCustomization,
    isFeatured: item.isFeatured ?? false,
    isNew: item.isNew ?? false,
    isPopular: item.isPopular ?? false,
    isVegetarian: item.isVegetarian ?? false,
    isVegan: item.isVegan ?? false,
    isSpicy: item.isSpicy ?? false,
  };
}

export default async function MenuPage() {
  let categories: {
    slug: string;
    nameFr: string;
    products: HomeProduct[];
  }[] = getStaticCatalog().categories.map((cat) => ({
    slug: cat.slug,
    nameFr: cat.nameFr,
    products: cat.products.map((p) =>
      toCard({ ...p, requiresCustomization: false }),
    ),
  }));
  let total = categories.reduce((s, c) => s + c.products.length, 0);
  let fromDb = false;

  if (await dbAvailable()) {
    try {
      const rows = await prisma.category.findMany({
        where: { isActive: true, deletedStatus: 0 },
        orderBy: { sortOrder: "asc" },
        include: {
          products: {
            where: { isAvailable: true, deletedStatus: 0 },
            orderBy: { sortOrder: "asc" },
            include: {
              addonGroups: {
                where: { isActive: true, required: true },
                select: { id: true },
              },
            },
          },
        },
      });
      categories = rows.map((cat) => ({
        slug: cat.slug,
        nameFr: cat.nameFr,
        products: cat.products.map((item) =>
          toCard({
            ...item,
            requiresCustomization: item.addonGroups.length > 0,
          }),
        ),
      }));
      total = categories.reduce((s, c) => s + c.products.length, 0);
      fromDb = true;
    } catch {
      // static fallback
    }
  }

  return (
    <main className="bg-ink text-bone">
      <div className="relative">
        <SiteHeader />
        <div className="border-b border-[color:var(--line)] bg-ink-soft px-4 pb-10 pt-28 sm:px-6 sm:pb-14 sm:pt-32 md:px-10 md:pb-16">
          <div className="mx-auto max-w-7xl">
            <p className="mb-2 text-[0.65rem] uppercase tracking-[0.24em] text-gold sm:mb-3 sm:text-[0.72rem]">
              Annemasse
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl md:text-6xl">
              La <span className="gold-text">carte</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-[#c4bbaa] sm:text-base">
              {total} produits.
              {fromDb
                ? " Personnalisez vos options, ajoutez au panier et payez en ligne."
                : " Catalogue affiché hors-ligne — connectez PostgreSQL sur Vercel pour activer panier et paiement."}
            </p>
          </div>
        </div>
      </div>

      <MenuCatalogClient categories={categories} />

      <SiteFooter />
    </main>
  );
}
