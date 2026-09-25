import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { ProductConfigurator } from "@/components/menu/ProductConfigurator";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return { title: "Produit · Sushi D'or" };
  return {
    title: `${product.nameFr} · Sushi D'or`,
    description: product.description ?? product.nameFr,
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { edit } = await searchParams;

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

  if (!product || !product.isAvailable) notFound();

  let initialAddonIds: string[] = [];
  let initialQuantity = 1;
  let cartItemId: string | undefined;
  let mode: "add" | "edit" = "add";

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

  const detail = {
    id: product.id,
    slug: product.slug,
    nameFr: product.nameFr,
    description: product.description,
    priceCents: product.priceCents,
    imageUrl: product.imageUrl,
    requiresCustomization: product.addonGroups.some((g) => g.required),
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

  return (
    <main className="bg-ink text-bone">
      <div className="relative">
        <SiteHeader />
        <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-8 pt-28 sm:gap-10 sm:px-6 sm:pb-20 sm:pt-32 md:grid-cols-2 md:px-10 md:pb-28">
          <div
            className="aspect-[4/3] bg-cover bg-center sm:min-h-[360px] md:min-h-[520px]"
            style={{
              backgroundImage: product.imageUrl
                ? `url(${product.imageUrl})`
                : undefined,
            }}
            role="img"
            aria-label={product.nameFr}
          />
          <div>
            {product.category ? (
              <Link
                href={`/menu#${product.category.slug}`}
                className="mb-3 text-[0.65rem] uppercase tracking-[0.24em] text-gold"
              >
                {product.category.nameFr}
              </Link>
            ) : null}
            <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl">
              {product.nameFr}
            </h1>
            <p className="mt-3 text-xl text-gold sm:text-2xl">
              {formatEuro(product.priceCents)}
            </p>
            {product.description ? (
              <p className="mt-4 text-sm text-mist sm:text-base">
                {product.description}
              </p>
            ) : null}

            <div className="mt-8">
              <ProductConfigurator
                product={detail}
                initialAddonIds={initialAddonIds}
                initialQuantity={initialQuantity}
                cartItemId={cartItemId}
                mode={mode}
              />
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
