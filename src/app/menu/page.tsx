import { ProductCard } from "@/components/menu/ProductCard";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { menuData } from "@/lib/menu";

export const metadata = {
  title: "La carte · Sushi D'or",
  description:
    "Carte Sushi D'or à Annemasse et Thonon-les-Bains — sushis, makis, spécialités et menus.",
};

export default function MenuPage() {
  const { categories, products } = menuData;

  return (
    <main className="bg-ink text-bone">
      <div className="relative">
        <SiteHeader />
        <div className="border-b border-[color:var(--line)] bg-ink-soft px-4 pb-10 pt-28 sm:px-6 sm:pb-14 sm:pt-32 md:px-10 md:pb-16">
          <div className="mx-auto max-w-7xl">
            <p className="mb-2 text-[0.65rem] uppercase tracking-[0.24em] text-gold sm:mb-3 sm:text-[0.72rem] sm:tracking-[0.28em]">
              Annemasse · Thonon-les-Bains
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl text-bone sm:text-5xl md:text-6xl">
              La <span className="gold-text">carte</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-mist sm:mt-4 sm:text-base">
              {products.length} produits. Les prix sont ceux de notre menu
              actuel. La commande en ligne arrive bientôt.
            </p>
            <nav
              className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:mt-10 sm:flex-wrap sm:overflow-visible sm:px-0"
              aria-label="Catégories"
            >
              {categories.map((cat) => (
                <a
                  key={cat.slug}
                  href={`#${cat.slug}`}
                  className="shrink-0 border border-[color:var(--line)] px-2.5 py-1.5 text-[0.6rem] uppercase tracking-[0.12em] text-mist transition-colors hover:border-gold hover:text-champagne sm:px-3 sm:text-[0.65rem] sm:tracking-[0.14em]"
                >
                  {cat.nameFr}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-12 px-3 py-10 sm:space-y-16 sm:px-6 sm:py-16 md:space-y-20 md:px-10 md:py-24">
        {categories.map((cat) => {
          const items = products.filter((p) => p.categorySlug === cat.slug);
          if (items.length === 0) return null;
          return (
            <section key={cat.slug} id={cat.slug} className="scroll-mt-24 sm:scroll-mt-28">
              <div className="mb-4 flex items-end justify-between gap-3 px-1 sm:mb-8 sm:gap-4">
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-champagne sm:text-3xl md:text-4xl">
                  {cat.nameFr}
                </h2>
                <span className="shrink-0 text-[0.65rem] text-mist sm:text-xs">
                  {items.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                {items.map((item) => (
                  <ProductCard key={item.slug} product={item} />
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
