import { dbAvailable, prisma } from "@/lib/prisma";
import { getStaticCatalog } from "@/lib/catalog-static";

export const HOMEPAGE_PRODUCTS_PER_CATEGORY = 4;

export type HomeProduct = {
  id: string;
  slug: string;
  nameFr: string;
  description: string | null;
  shortDescription: string | null;
  priceCents: number;
  imageUrl: string | null;
  requiresCustomization: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isSpicy: boolean;
};

export type HomeCategory = {
  id: string;
  slug: string;
  nameFr: string;
  description: string | null;
  products: HomeProduct[];
  totalCount: number;
};

export type HomeCatalog = {
  featured: HomeProduct[];
  categories: HomeCategory[];
  fromDb: boolean;
};

function mapProduct(item: {
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
  addonGroups?: { id: string }[];
}): HomeProduct {
  return {
    id: item.id,
    slug: item.slug,
    nameFr: item.nameFr,
    description: item.description,
    shortDescription: item.shortDescription ?? item.description,
    priceCents: item.priceCents,
    imageUrl: item.imageUrl,
    requiresCustomization: (item.addonGroups?.length ?? 0) > 0,
    isFeatured: item.isFeatured ?? false,
    isNew: item.isNew ?? false,
    isPopular: item.isPopular ?? false,
    isVegetarian: item.isVegetarian ?? false,
    isVegan: item.isVegan ?? false,
    isSpicy: item.isSpicy ?? false,
  };
}

export async function getHomeCatalog(): Promise<HomeCatalog> {
  if (await dbAvailable()) {
    try {
      const [featuredRows, categoryRows] = await Promise.all([
        prisma.product.findMany({
          where: { isAvailable: true, isFeatured: true },
          orderBy: [{ featuredOrder: "asc" }, { sortOrder: "asc" }],
          take: HOMEPAGE_PRODUCTS_PER_CATEGORY,
          include: {
            addonGroups: {
              where: { isActive: true, required: true },
              select: { id: true },
            },
          },
        }),
        prisma.category.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            products: {
              where: { isAvailable: true },
              orderBy: { sortOrder: "asc" },
              take: HOMEPAGE_PRODUCTS_PER_CATEGORY,
              include: {
                addonGroups: {
                  where: { isActive: true, required: true },
                  select: { id: true },
                },
              },
            },
            _count: {
              select: { products: { where: { isAvailable: true } } },
            },
          },
        }),
      ]);

      return {
        fromDb: true,
        featured: featuredRows.map(mapProduct),
        categories: categoryRows
          .filter((c) => c._count.products > 0)
          .map((c) => ({
            id: c.id,
            slug: c.slug,
            nameFr: c.nameFr,
            description: c.description,
            totalCount: c._count.products,
            products: c.products.map(mapProduct),
          })),
      };
    } catch {
      // fall through to static
    }
  }

  const staticCatalog = getStaticCatalog();
  const featured = staticCatalog.products
    .filter((_, i) => i < HOMEPAGE_PRODUCTS_PER_CATEGORY)
    .map((p) =>
      mapProduct({
        ...p,
        shortDescription: p.description,
        isFeatured: true,
      }),
    );

  return {
    fromDb: false,
    featured,
    categories: staticCatalog.categories
      .filter((c) => c.products.length > 0)
      .map((c, i) => ({
        id: `static-cat-${c.slug}`,
        slug: c.slug,
        nameFr: c.nameFr,
        description: null,
        totalCount: c.products.length,
        products: c.products
          .slice(0, HOMEPAGE_PRODUCTS_PER_CATEGORY)
          .map((p) =>
            mapProduct({
              ...p,
              shortDescription: p.description,
              isFeatured: i === 0,
            }),
          ),
      })),
  };
}
