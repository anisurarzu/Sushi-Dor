import Link from "next/link";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { formatEuro, menuData } from "@/lib/menu";

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
        <div className="border-b border-[color:var(--line)] bg-ink-soft px-6 pb-16 pt-32 md:px-10">
          <div className="mx-auto max-w-7xl">
            <p className="mb-3 text-[0.72rem] uppercase tracking-[0.28em] text-gold">
              Annemasse · Thonon-les-Bains
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-5xl text-bone md:text-6xl">
              La <span className="gold-text">carte</span>
            </h1>
            <p className="mt-4 max-w-xl text-mist">
              {products.length} produits. Les prix sont ceux de notre menu
              actuel. La commande en ligne arrive bientôt.
            </p>
            <nav
              className="mt-10 flex flex-wrap gap-2"
              aria-label="Catégories"
            >
              {categories.map((cat) => (
                <a
                  key={cat.slug}
                  href={`#${cat.slug}`}
                  className="border border-[color:var(--line)] px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.14em] text-mist transition-colors hover:border-gold hover:text-champagne"
                >
                  {cat.nameFr}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-20 px-6 py-16 md:px-10 md:py-24">
        {categories.map((cat) => {
          const items = products.filter((p) => p.categorySlug === cat.slug);
          if (items.length === 0) return null;
          return (
            <section key={cat.slug} id={cat.slug} className="scroll-mt-28">
              <div className="mb-8 flex items-end justify-between gap-4">
                <h2 className="font-[family-name:var(--font-display)] text-3xl text-champagne md:text-4xl">
                  {cat.nameFr}
                </h2>
                <span className="text-xs text-mist">{items.length} produits</span>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/menu/${item.slug}`}
                    className="group border border-[color:var(--line)] transition-colors hover:border-gold"
                  >
                    <div
                      className="aspect-[16/10] bg-cover bg-center"
                      style={{ backgroundImage: `url(${item.imageUrl})` }}
                    />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-[family-name:var(--font-display)] text-xl text-bone group-hover:text-champagne">
                          {item.nameFr}
                        </h3>
                        <p className="shrink-0 text-sm text-gold">
                          {formatEuro(item.priceCents)}
                        </p>
                      </div>
                      {item.description ? (
                        <p className="mt-2 line-clamp-2 text-sm text-mist">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  </Link>
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
