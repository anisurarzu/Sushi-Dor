import Link from "next/link";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { ProductCardDb } from "@/components/menu/ProductCardDb";
import type { HomeProduct } from "@/lib/home-catalog";

type Props = {
  category: {
    slug: string;
    nameFr: string;
    description: string | null;
  };
  products: HomeProduct[];
};

export function CategoryMenuPage({ category, products }: Props) {
  return (
    <main className="bg-ink text-bone">
      <div className="relative">
        <SiteHeader />
        <div className="border-b border-[color:var(--line)] bg-ink-soft px-4 pb-10 pt-28 sm:px-6 sm:pb-14 sm:pt-32 md:px-10">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/menu"
              className="text-[0.65rem] uppercase tracking-[0.2em] text-gold"
            >
              ← La carte
            </Link>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl sm:text-5xl md:text-6xl">
              {category.nameFr}
            </h1>
            {category.description ? (
              <p className="mt-3 max-w-xl text-sm text-[#c4bbaa] sm:text-base">
                {category.description}
              </p>
            ) : (
              <p className="mt-3 max-w-xl text-sm text-[#c4bbaa] sm:text-base">
                {products.length} produit{products.length > 1 ? "s" : ""} —
                personnalisez et commandez en ligne.
              </p>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-3 py-10 sm:px-6 sm:py-14 md:px-10">
          {products.length === 0 ? (
            <p className="text-[#c4bbaa]">Aucun produit disponible.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {products.map((product, i) => (
                <ProductCardDb
                  key={product.id}
                  product={product}
                  priority={i < 2}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
