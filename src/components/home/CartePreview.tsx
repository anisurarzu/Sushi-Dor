import Link from "next/link";
import { ProductCard } from "@/components/menu/ProductCard";
import { getFeaturedProducts, menuData } from "@/lib/menu";

export function CartePreview() {
  const featured = getFeaturedProducts(8);

  return (
    <section
      id="carte"
      className="relative bg-ink px-3 py-16 sm:px-6 sm:py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:mb-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl px-1">
            <p className="mb-2 text-[0.65rem] uppercase tracking-[0.24em] text-gold sm:mb-3 sm:text-[0.72rem] sm:tracking-[0.28em]">
              Notre carte
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-bone sm:text-4xl md:text-5xl">
              Une sélection <span className="gold-text">prêtieuse</span>
            </h2>
            <p className="mt-3 text-sm text-mist sm:mt-4 sm:text-base">
              {menuData.products.length} produits — sushis, makis, spécialités et
              menus, préparés à la commande.
            </p>
          </div>
          <Link href="/menu" className="btn-ghost shrink-0 self-start">
            Toute la carte
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {featured.map((item) => (
            <ProductCard key={item.slug} product={item} variant="featured" />
          ))}
        </div>
      </div>
    </section>
  );
}
