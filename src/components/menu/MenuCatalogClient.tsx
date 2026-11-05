"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CategoryFireTitle } from "@/components/brand/CategoryFireTitle";
import { FireText } from "@/components/brand/FireText";
import { ProductCardDb } from "@/components/menu/ProductCardDb";
import type { HomeProduct } from "@/lib/home-catalog";

type Cat = {
  slug: string;
  nameFr: string;
  products: HomeProduct[];
};

export function MenuCatalogClient({ categories }: { categories: Cat[] }) {
  const defaultOrder = useMemo(
    () => categories.map((c) => c.slug),
    [categories],
  );
  const [order, setOrder] = useState(defaultOrder);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const bySlug = useMemo(
    () => new Map(categories.map((c) => [c.slug, c])),
    [categories],
  );

  function selectCategory(slug: string) {
    setActiveSlug(slug);
    setOrder((prev) => {
      const base = prev.length ? prev : defaultOrder;
      return [slug, ...base.filter((s) => s !== slug)];
    });
    requestAnimationFrame(() => {
      document
        .getElementById("menu-catalog")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const sectionOrder = order.length ? order : defaultOrder;

  return (
    <>
      <div className="border-b border-[color:var(--line)] bg-ink-soft/40 px-4 py-4 sm:px-6 md:px-10">
        <nav
          className="mx-auto flex max-w-7xl gap-2 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap sm:overflow-visible"
          aria-label="Catégories"
        >
          {categories.map((cat) => {
            const isActive = activeSlug === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => selectCategory(cat.slug)}
                className={`shrink-0 border px-2.5 py-1.5 text-[0.6rem] uppercase tracking-[0.12em] transition-colors ${
                  isActive
                    ? "border-gold/70 text-champagne"
                    : "border-[color:var(--line)] text-mist hover:border-gold hover:text-champagne"
                }`}
              >
                {isActive ? (
                  <FireText sparks={12} depth={false}>
                    {cat.nameFr}
                  </FireText>
                ) : (
                  cat.nameFr
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div
        id="menu-catalog"
        className="mx-auto max-w-7xl space-y-12 px-3 py-10 scroll-mt-24 sm:space-y-16 sm:px-6 md:px-10 md:py-24"
      >
        {sectionOrder.map((slug) => {
          const cat = bySlug.get(slug);
          if (!cat || cat.products.length === 0) return null;
          return (
            <section key={cat.slug} id={cat.slug} className="scroll-mt-24">
              <div className="mb-4 flex items-end justify-between gap-3 px-1 sm:mb-8">
                <CategoryFireTitle
                  id={cat.slug}
                  as="h2"
                  className="font-[family-name:var(--font-display)] text-2xl text-champagne sm:text-3xl md:text-4xl"
                >
                  {cat.nameFr}
                </CategoryFireTitle>
                <Link
                  href={`/menu/${cat.slug}`}
                  className="text-[0.65rem] uppercase tracking-[0.14em] text-gold sm:text-xs"
                >
                  Voir tout →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                {cat.products.map((item) => (
                  <ProductCardDb key={item.id} product={item} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
