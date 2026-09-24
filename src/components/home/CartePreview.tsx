import Link from "next/link";
import { formatEuro, getFeaturedProducts, menuData } from "@/lib/menu";

export function CartePreview() {
  const featured = getFeaturedProducts(8);

  return (
    <section id="carte" className="relative bg-ink px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-[0.72rem] uppercase tracking-[0.28em] text-gold">
              Notre carte
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl text-bone md:text-5xl">
              Une sélection <span className="gold-text">prêtieuse</span>
            </h2>
            <p className="mt-4 text-mist">
              {menuData.products.length} produits — sushis, makis, spécialités et
              menus, préparés à la commande.
            </p>
          </div>
          <Link href="/menu" className="btn-ghost shrink-0">
            Toute la carte
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((item) => (
            <Link
              key={item.slug}
              href={`/menu/${item.slug}`}
              className="group block"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${item.imageUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl text-champagne">
                    {item.nameFr}
                  </h3>
                  <p className="mt-2 text-sm text-gold">
                    {formatEuro(item.priceCents)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
