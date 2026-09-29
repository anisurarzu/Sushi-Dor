import Link from "next/link";
import { ProductCardDb } from "@/components/menu/ProductCardDb";
import {
  getHomeCatalog,
  type HomeCategory,
  type HomeProduct,
} from "@/lib/home-catalog";

export const dynamic = "force-dynamic";

function ProductGrid({
  products,
  priorityCount = 0,
}: {
  products: HomeProduct[];
  priorityCount?: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {products.map((product, index) => (
        <div
          key={product.id}
          className={
            index >= 2
              ? index >= 3
                ? "hidden lg:block"
                : "hidden sm:block"
              : undefined
          }
        >
          <ProductCardDb product={product} priority={index < priorityCount} />
        </div>
      ))}
    </div>
  );
}

function CategorySection({
  title,
  description,
  products,
  voirToutHref,
  anchorId,
  priorityCount = 0,
}: {
  title: string;
  description?: string | null;
  products: HomeProduct[];
  voirToutHref: string;
  anchorId: string;
  priorityCount?: number;
}) {
  if (products.length === 0) return null;

  return (
    <section id={anchorId} className="scroll-mt-28">
      <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h3 className="font-[family-name:var(--font-display)] text-2xl text-champagne sm:text-3xl md:text-4xl">
            {title}
          </h3>
          {description ? (
            <p className="mt-2 text-sm text-[#c4bbaa] sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        <Link
          href={voirToutHref}
          className="shrink-0 text-[0.68rem] uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-bright"
        >
          Voir tout →
        </Link>
      </div>
      <ProductGrid products={products} priorityCount={priorityCount} />
    </section>
  );
}

function CategoryNav({
  featured,
  categories,
}: {
  featured: HomeProduct[];
  categories: HomeCategory[];
}) {
  const links = [
    ...(featured.length > 0
      ? [{ href: "#incontournables", label: "Incontournables" }]
      : []),
    ...categories.map((c) => ({
      href: `#cat-${c.slug}`,
      label: c.nameFr,
    })),
    { href: "/menu", label: "Tous" },
  ];

  return (
    <nav
      className="-mx-3 mb-10 flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-none sm:mx-0 sm:mb-14 sm:flex-wrap sm:overflow-visible sm:px-0"
      aria-label="Catégories"
    >
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="shrink-0 border border-[color:var(--line)] px-3 py-2 text-[0.62rem] uppercase tracking-[0.14em] text-mist transition-colors hover:border-gold hover:text-gold"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}

export async function CartePreview() {
  const { featured, categories, fromDb } = await getHomeCatalog();

  return (
    <section
      id="carte"
      className="relative bg-ink px-3 py-16 sm:px-6 sm:py-24 md:px-10 md:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-2xl px-1 sm:mb-10">
          <p className="mb-2 text-[0.65rem] uppercase tracking-[0.24em] text-gold sm:text-[0.72rem]">
            Notre carte
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-bone sm:text-4xl md:text-5xl">
            Une sélection <span className="gold-text">précieuse</span>
          </h2>
          <p className="mt-3 text-sm text-[#c4bbaa] sm:mt-4 sm:text-base">
            Parcourez nos catégories, personnalisez vos options et commandez en
            ligne.
            {!fromDb ? (
              <span className="mt-2 block text-xs text-gold/80">
                Catalogue en mode lecture (base de données production à
                connecter).
              </span>
            ) : null}
          </p>
        </div>

        <CategoryNav featured={featured} categories={categories} />

        <div className="space-y-16 sm:space-y-20 md:space-y-24">
          {featured.length > 0 ? (
            <CategorySection
              anchorId="incontournables"
              title="Nos incontournables"
              description="Les signatures de la maison, choisies par notre équipe."
              products={featured}
              voirToutHref="/menu"
              priorityCount={2}
            />
          ) : null}

          {categories.map((cat) => (
            <CategorySection
              key={cat.id}
              anchorId={`cat-${cat.slug}`}
              title={cat.nameFr}
              description={cat.description}
              products={cat.products}
              voirToutHref={`/menu/${cat.slug}`}
            />
          ))}
        </div>

        <div className="mt-14 flex justify-center sm:mt-16">
          <Link href="/menu" className="btn-ghost">
            Voir toute la carte
          </Link>
        </div>
      </div>
    </section>
  );
}
