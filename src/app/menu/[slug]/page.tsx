import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { ProductConfigurator } from "@/components/menu/ProductConfigurator";
import { getStaticCatalog } from "@/lib/catalog-static";
import { formatEuro } from "@/lib/pricing";
import { dbAvailable, prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  if (await dbAvailable()) {
    try {
      const product = await prisma.product.findUnique({ where: { slug } });
      if (product) {
        return {
          title: `${product.nameFr} · Sushi D'or`,
          description: product.description ?? product.nameFr,
        };
      }
    } catch {
      // fall through
    }
  }
  const staticProduct = getStaticCatalog().products.find((p) => p.slug === slug);
  if (!staticProduct) return { title: "Produit · Sushi D'or" };
  return {
    title: `${staticProduct.nameFr} · Sushi D'or`,
    description: staticProduct.description ?? staticProduct.nameFr,
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { edit } = await searchParams;

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
        <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-8 pt-28 sm:gap-10 sm:px-6 sm:pb-20 sm:pt-32 md:grid-cols-2 md:px-10 md:pb-28">
          <div
            className="aspect-[4/3] bg-cover bg-center sm:min-h-[360px] md:min-h-[520px]"
            style={{
              backgroundImage: detail.imageUrl
                ? `url(${detail.imageUrl})`
                : undefined,
            }}
            role="img"
            aria-label={detail.nameFr}
          />
          <div>
            {detail.categorySlug ? (
              <Link
                href={`/menu#${detail.categorySlug}`}
                className="mb-3 text-[0.65rem] uppercase tracking-[0.24em] text-gold"
              >
                {detail.categoryNameFr}
              </Link>
            ) : null}
            <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl">
              {detail.nameFr}
            </h1>
            <p className="mt-3 text-xl text-gold sm:text-2xl">
              {formatEuro(detail.priceCents)}
            </p>
            {detail.description ? (
              <p className="mt-4 text-sm text-mist sm:text-base">
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
                <div className="border border-[color:var(--line)] bg-ink-soft p-4 text-sm text-mist">
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
