import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { CategoryMenuPage } from "@/components/menu/CategoryMenuPage";
import { ProductConfigurator } from "@/components/menu/ProductConfigurator";
import { getStaticCatalog } from "@/lib/catalog-static";
import { formatEuro } from "@/lib/pricing";
import { dbAvailable, prisma } from "@/lib/prisma";
import type { HomeProduct } from "@/lib/home-catalog";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
};

function toHomeProduct(item: {
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

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  if (await dbAvailable()) {
    try {
      const category = await prisma.category.findFirst({
        where: { slug, isActive: true },
      });
      if (category) {
        return {
          title: `${category.nameFr} · Sushi D'or`,
          description: category.description ?? category.nameFr,
        };
      }
      const product = await prisma.product.findUnique({ where: { slug } });
      if (product) {
        return {
          title: `${product.nameFr} · Sushi D'or`,
          description:
            product.shortDescription ??
            product.description ??
            product.nameFr,
        };
      }
    } catch {
      // fall through
    }
  }
  const staticCat = getStaticCatalog().categories.find((c) => c.slug === slug);
  if (staticCat) {
    return { title: `${staticCat.nameFr} · Sushi D'or` };
  }
  const staticProduct = getStaticCatalog().products.find((p) => p.slug === slug);
  if (!staticProduct) return { title: "Sushi D'or" };
  return {
    title: `${staticProduct.nameFr} · Sushi D'or`,
    description: staticProduct.description ?? staticProduct.nameFr,
  };
}

export default async function MenuSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { edit } = await searchParams;

  // 1) Category page — /menu/sushis style
  let categoryView: {
    slug: string;
    nameFr: string;
    description: string | null;
    products: HomeProduct[];
  } | null = null;

  if (await dbAvailable()) {
    try {
      const category = await prisma.category.findFirst({
        where: { slug, isActive: true },
        include: {
          products: {
            where: { isAvailable: true },
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
      if (category) {
        categoryView = {
          slug: category.slug,
          nameFr: category.nameFr,
          description: category.description,
          products: category.products.map((p) =>
            toHomeProduct({
              ...p,
              requiresCustomization: p.addonGroups.length > 0,
            }),
          ),
        };
      }
    } catch {
      // continue to product / static
    }
  } else {
    const staticCat = getStaticCatalog().categories.find((c) => c.slug === slug);
    if (staticCat) {
      categoryView = {
        slug: staticCat.slug,
        nameFr: staticCat.nameFr,
        description: null,
        products: staticCat.products.map((p) =>
          toHomeProduct({ ...p, requiresCustomization: false }),
        ),
      };
    }
  }

  if (categoryView) {
    return (
      <CategoryMenuPage
        category={{
          slug: categoryView.slug,
          nameFr: categoryView.nameFr,
          description: categoryView.description,
        }}
        products={categoryView.products}
      />
    );
  }

  // 2) Product detail page
  let detail: {
    id: string;
    slug: string;
    nameFr: string;
    description: string | null;
    priceCents: number;
    imageUrl: string | null;
    requiresCustomization: boolean;
    categoryNameFr?: string;
    categorySlug?: string;
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
  } | null = null;

  let cartItemId: string | undefined;
  let initialAddonIds: string[] = [];
  let initialQuantity = 1;
  let mode: "add" | "edit" = "add";
  let orderingEnabled = false;

  if (await dbAvailable()) {
    try {
      const product = await prisma.product.findUnique({
        where: { slug },
        include: {
          category: true,
          addonGroups: {
            where: { isActive: true },
            orderBy: { displayOrder: "asc" },
            include: {
              addons: {
                where: { isActive: true },
                orderBy: { displayOrder: "asc" },
                include: { allergens: { include: { allergen: true } } },
              },
            },
          },
        },
      });

      if (product?.isAvailable) {
        orderingEnabled = true;
        detail = {
          id: product.id,
          slug: product.slug,
          nameFr: product.nameFr,
          description: product.description,
          priceCents: product.priceCents,
          imageUrl: product.imageUrl,
          requiresCustomization: product.addonGroups.some((g) => g.required),
          categoryNameFr: product.category.nameFr,
          categorySlug: product.category.slug,
          addonGroups: product.addonGroups.map((g) => ({
            id: g.id,
            nameFr: g.nameFr,
            description: g.description,
            selectionType: g.selectionType,
            required: g.required,
            minSelections: g.minSelections,
            maxSelections: g.maxSelections,
            addons: g.addons.map((a) => ({
              id: a.id,
              nameFr: a.nameFr,
              description: a.description,
              priceCents: a.priceCents,
              allergens: a.allergens.map((x) => x.allergen.nameFr),
            })),
          })),
        };

        if (edit) {
          const item = await prisma.cartItem.findUnique({
            where: { id: edit },
            include: { addons: true },
          });
          if (item && item.productId === product.id) {
            cartItemId = item.id;
            initialQuantity = item.quantity;
            initialAddonIds = item.addons.map((a) => a.addonId);
            mode = "edit";
          }
        }
      }
    } catch {
      // static below
    }
  }

  if (!detail) {
    const staticProduct = getStaticCatalog().products.find((p) => p.slug === slug);
    if (!staticProduct) notFound();
    const cat = getStaticCatalog().categories.find(
      (c) => c.slug === staticProduct.categorySlug,
    );
    detail = {
      id: staticProduct.id,
      slug: staticProduct.slug,
      nameFr: staticProduct.nameFr,
      description: staticProduct.description,
      priceCents: staticProduct.priceCents,
      imageUrl: staticProduct.imageUrl,
      requiresCustomization: false,
      categoryNameFr: cat?.nameFr,
      categorySlug: cat?.slug,
      addonGroups: [],
    };
  }

  return (
    <main className="bg-ink text-bone">
      <div className="relative">
        <SiteHeader />
        <div className="mx-auto grid max-w-7xl items-start gap-8 px-4 pb-8 pt-28 sm:gap-10 sm:px-6 sm:pb-20 sm:pt-32 md:grid-cols-2 md:gap-12 md:px-10 md:pb-28">
          <div className="relative aspect-[4/3] min-w-0 overflow-hidden bg-ink-soft sm:min-h-[360px] md:sticky md:top-28 md:aspect-auto md:min-h-[min(70vh,560px)]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: detail.imageUrl
                  ? `url(${detail.imageUrl})`
                  : undefined,
              }}
              role="img"
              aria-label={detail.nameFr}
            />
          </div>
          <div className="relative z-10 min-w-0 bg-ink">
            {detail.categorySlug ? (
              <Link
                href={`/menu/${detail.categorySlug}`}
                className="mb-3 inline-block text-[0.65rem] uppercase tracking-[0.24em] text-gold"
              >
                {detail.categoryNameFr}
              </Link>
            ) : null}
            <h1 className="font-[family-name:var(--font-display)] text-3xl leading-tight text-bone sm:text-4xl md:text-5xl">
              {detail.nameFr}
            </h1>
            <p className="mt-3 text-xl text-gold sm:text-2xl">
              {formatEuro(detail.priceCents)}
            </p>
            {detail.description ? (
              <p className="mt-4 text-sm leading-relaxed text-[#c4bbaa] sm:text-base">
                {detail.description}
              </p>
            ) : null}

            <div className="mt-8">
              {orderingEnabled ? (
                <ProductConfigurator
                  product={detail}
                  initialAddonIds={initialAddonIds}
                  initialQuantity={initialQuantity}
                  cartItemId={cartItemId}
                  mode={mode}
                />
              ) : (
                <div className="border border-[color:var(--line)] bg-ink-soft p-4 text-sm text-[#c4bbaa]">
                  La commande en ligne sera disponible dès que la base de données
                  production (PostgreSQL) sera connectée sur Vercel.
                  <Link href="/menu" className="btn-ghost mt-4 inline-flex">
                    Retour à la carte
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
