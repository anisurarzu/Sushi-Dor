import Link from "next/link";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { ProductCardDb } from "@/components/menu/ProductCardDb";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "La carte · Sushi D'or",
  description:
    "Carte Sushi D'or à Annemasse et Thonon-les-Bains — sushis, makis, spécialités et menus.",
};

export default async function MenuPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
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

  const total = categories.reduce((s, c) => s + c.products.length, 0);

  return (
    <main className="bg-ink text-bone">
      <div className="relative">
        <SiteHeader />
        <div className="border-b border-[color:var(--line)] bg-ink-soft px-4 pb-10 pt-28 sm:px-6 sm:pb-14 sm:pt-32 md:px-10 md:pb-16">
          <div className="mx-auto max-w-7xl">
            <p className="mb-2 text-[0.65rem] uppercase tracking-[0.24em] text-gold sm:mb-3 sm:text-[0.72rem]">
              Annemasse · Thonon-les-Bains
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl md:text-6xl">
              La <span className="gold-text">carte</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-mist sm:text-base">
              {total} produits. Personnalisez vos options, ajoutez au panier et
              payez en ligne.
            </p>
            <nav
              className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:mt-10 sm:flex-wrap sm:overflow-visible sm:px-0"
              aria-label="Catégories"
            >
              {categories.map((cat) => (
                <a
                  key={cat.slug}
                  href={`#${cat.slug}`}
                  className="shrink-0 border border-[color:var(--line)] px-2.5 py-1.5 text-[0.6rem] uppercase tracking-[0.12em] text-mist hover:border-gold hover:text-champagne"
                >
                  {cat.nameFr}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-12 px-3 py-10 sm:space-y-16 sm:px-6 md:px-10 md:py-24">
        {categories.map((cat) => {
          if (cat.products.length === 0) return null;
          return (
            <section key={cat.slug} id={cat.slug} className="scroll-mt-24">
              <div className="mb-4 flex items-end justify-between gap-3 px-1 sm:mb-8">
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-champagne sm:text-3xl md:text-4xl">
                  {cat.nameFr}
                </h2>
                <span className="text-[0.65rem] text-mist sm:text-xs">
                  {cat.products.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                {cat.products.map((item) => (
                  <ProductCardDb
                    key={item.id}
                    product={{
                      slug: item.slug,
                      nameFr: item.nameFr,
                      description: item.description,
                      priceCents: item.priceCents,
                      imageUrl: item.imageUrl,
                      requiresCustomization: item.addonGroups.length > 0,
                    }}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <SiteFooter />
    </main>
  );
}
