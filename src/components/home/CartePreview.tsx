import { CatalogBrowser } from "@/components/home/CatalogBrowser";
import { getHomeCatalog } from "@/lib/home-catalog";

export const dynamic = "force-dynamic";

export async function CartePreview() {
  const { featured, categories, fromDb } = await getHomeCatalog();

  return (
    <section
      id="carte"
      className="relative bg-ink px-3 py-12 sm:px-6 sm:py-20 md:px-10 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <CatalogBrowser
          featured={featured}
          categories={categories}
          fromDb={fromDb}
        />
      </div>
    </section>
  );
}
