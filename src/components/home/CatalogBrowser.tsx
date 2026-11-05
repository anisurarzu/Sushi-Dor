"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CategoryFireTitle } from "@/components/brand/CategoryFireTitle";
import { FireText } from "@/components/brand/FireText";
import { ProductCardDb } from "@/components/menu/ProductCardDb";
import type { HomeCategory, HomeProduct } from "@/lib/home-catalog";

type Props = {
  featured: HomeProduct[];
  categories: HomeCategory[];
  fromDb: boolean;
};

function ProductGrid({
  products,
  priorityCount = 0,
  limit,
}: {
  products: HomeProduct[];
  priorityCount?: number;
  limit?: number;
}) {
  const list = typeof limit === "number" ? products.slice(0, limit) : products;
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {list.map((product, index) => (
        <div
          key={product.id}
          className={
            limit
              ? index >= 2
                ? index >= 3
                  ? "hidden lg:block"
                  : "hidden sm:block"
                : undefined
              : undefined
          }
        >
          <ProductCardDb product={product} priority={index < priorityCount} />
        </div>
      ))}
    </div>
  );
}

export function CatalogBrowser({ featured, categories, fromDb }: Props) {
  const defaultOrder = useMemo(() => {
    const ids: string[] = [];
    if (featured.length > 0) ids.push("incontournables");
    for (const c of categories) ids.push(c.slug);
    return ids;
  }, [featured.length, categories]);

  const [order, setOrder] = useState<string[]>(defaultOrder);
  const [activeId, setActiveId] = useState<string | null>(null);

  const bySlug = useMemo(() => {
    const map = new Map(categories.map((c) => [c.slug, c]));
    return map;
  }, [categories]);

  const links = useMemo(
    () => [
      ...(featured.length > 0
        ? [
            {
              id: "incontournables",
              label: "Incontournables",
            },
          ]
        : []),
      ...categories.map((c) => ({ id: c.slug, label: c.nameFr })),
      { id: "tous", label: "Tous", href: "/menu" as const },
    ],
    [featured.length, categories],
  );

  function selectCategory(id: string) {
    if (id === "tous") return;
    setActiveId(id);
    setOrder((prev) => {
      const base = prev.length ? prev : defaultOrder;
      return [id, ...base.filter((x) => x !== id)];
    });
    // Keep the catalog header in view — selected block is now first under the nav
    requestAnimationFrame(() => {
      document
        .getElementById("carte-catalog")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const sectionOrder = order.length ? order : defaultOrder;

  return (
    <>
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

      <div id="carte-catalog" className="scroll-mt-28">
        <nav
          className="-mx-3 mb-10 flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-none sm:mx-0 sm:mb-14 sm:flex-wrap sm:overflow-visible sm:px-0"
          aria-label="Catégories"
        >
          {links.map((link) => {
            if ("href" in link && link.href) {
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  className="shrink-0 border border-[color:var(--line)] px-3 py-2 text-[0.62rem] uppercase tracking-[0.14em] text-mist transition-colors hover:border-gold hover:text-gold"
                >
                  {link.label}
                </Link>
              );
            }
            const isFire = activeId === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => selectCategory(link.id)}
                className={`shrink-0 border px-3 py-2 text-[0.62rem] uppercase tracking-[0.14em] transition-colors ${
                  isFire
                    ? "border-gold/70 text-champagne"
                    : "border-[color:var(--line)] text-mist hover:border-gold hover:text-gold"
                }`}
              >
                {isFire ? (
                  <FireText sparks={14} depth={false}>
                    {link.label}
                  </FireText>
                ) : (
                  link.label
                )}
              </button>
            );
          })}
        </nav>

        <div className="space-y-16 sm:space-y-20 md:space-y-24">
          {sectionOrder.map((id) => {
            if (id === "incontournables") {
              if (featured.length === 0) return null;
              return (
                <section key={id} id={id} className="scroll-mt-28">
                  <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-2xl">
                      <CategoryFireTitle
                        id={id}
                        className="font-[family-name:var(--font-display)] text-2xl text-champagne sm:text-3xl md:text-4xl"
                      >
                        Nos incontournables
                      </CategoryFireTitle>
                      <p className="mt-2 text-sm text-[#c4bbaa] sm:text-base">
                        Les signatures de la maison, choisies par notre équipe.
                      </p>
                    </div>
                    <Link
                      href="/menu"
                      className="shrink-0 text-[0.68rem] uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-bright"
                    >
                      Voir tout →
                    </Link>
                  </div>
                  <ProductGrid
                    products={featured}
                    priorityCount={2}
                    limit={8}
                  />
                </section>
              );
            }

            const cat = bySlug.get(id);
            if (!cat || cat.products.length === 0) return null;
            return (
              <section key={cat.id} id={`cat-${cat.slug}`} className="scroll-mt-28">
                <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-2xl">
                    <CategoryFireTitle
                      id={`cat-${cat.slug}`}
                      className="font-[family-name:var(--font-display)] text-2xl text-champagne sm:text-3xl md:text-4xl"
                    >
                      {cat.nameFr}
                    </CategoryFireTitle>
                    {cat.description ? (
                      <p className="mt-2 text-sm text-[#c4bbaa] sm:text-base">
                        {cat.description}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    href={`/menu/${cat.slug}`}
                    className="shrink-0 text-[0.68rem] uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-bright"
                  >
                    Voir tout →
                  </Link>
                </div>
                <ProductGrid products={cat.products} limit={8} />
              </section>
            );
          })}
        </div>
      </div>

      <div className="mt-14 flex justify-center sm:mt-16">
        <Link href="/menu" className="btn-ghost">
          Voir toute la carte
        </Link>
      </div>
    </>
  );
}
