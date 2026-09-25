import Link from "next/link";
import { ProductCardDb } from "@/components/menu/ProductCardDb";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function CartePreview() {
  const featured = await prisma.product.findMany({
    where: { isAvailable: true, isFeatured: true },
    take: 8,
    orderBy: { sortOrder: "asc" },
    include: {
      addonGroups: {
        where: { isActive: true, required: true },
        select: { id: true },
      },
    },
  });
  const count = await prisma.product.count({ where: { isAvailable: true } });

  return (
    <section
      id="carte"
      className="relative bg-ink px-3 py-16 sm:px-6 sm:py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:mb-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl px-1">
            <p className="mb-2 text-[0.65rem] uppercase tracking-[0.24em] text-gold sm:mb-3 sm:text-[0.72rem]">
              Notre carte
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-bone sm:text-4xl md:text-5xl">
              Une sélection <span className="gold-text">prêtieuse</span>
            </h2>
            <p className="mt-3 text-sm text-mist sm:mt-4 sm:text-base">
              {count} produits — personnalisez vos options et commandez en
              ligne.
            </p>
          </div>
          <Link href="/menu" className="btn-ghost shrink-0 self-start">
            Toute la carte
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {featured.map((item) => (
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
      </div>
    </section>
  );
}
