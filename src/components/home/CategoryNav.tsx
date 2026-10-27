"use client";

import { useEffect, useState } from "react";
import { FireText } from "@/components/brand/FireText";

type LinkItem = { href: string; label: string; id: string };

export function CategoryNav({
  featured,
  categories,
}: {
  featured: { length: number };
  categories: { slug: string; nameFr: string }[];
}) {
  const links: LinkItem[] = [
    ...(featured.length > 0
      ? [
          {
            href: "#incontournables",
            label: "Incontournables",
            id: "incontournables",
          },
        ]
      : []),
    ...categories.map((c) => ({
      href: `#cat-${c.slug}`,
      label: c.nameFr,
      id: `cat-${c.slug}`,
    })),
    { href: "/menu", label: "Tous", id: "tous" },
  ];

  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const ids = links.filter((l) => l.href.startsWith("#")).map((l) => l.id);

    const syncHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash && ids.includes(hash)) setActiveId(hash);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);

    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => Boolean(n));

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -42% 0px", threshold: [0.2, 0.35, 0.5] },
    );
    sections.forEach((s) => io.observe(s));

    return () => {
      window.removeEventListener("hashchange", syncHash);
      io.disconnect();
    };
    // links derived from props — stable enough for mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featured.length, categories]);

  return (
    <nav
      className="-mx-3 mb-10 flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-none sm:mx-0 sm:mb-14 sm:flex-wrap sm:overflow-visible sm:px-0"
      aria-label="Catégories"
    >
      {links.map((link) => {
        const isFire = activeId === link.id && link.href.startsWith("#");
        return (
          <a
            key={link.href}
            href={link.href}
            className={`shrink-0 border px-3 py-2 text-[0.62rem] uppercase tracking-[0.14em] transition-colors ${
              isFire
                ? "border-gold/70 text-champagne"
                : "border-[color:var(--line)] text-mist hover:border-gold hover:text-gold"
            }`}
            onClick={() => {
              if (link.href.startsWith("#")) setActiveId(link.id);
            }}
          >
            {isFire ? (
              <FireText sparks={14} depth={false}>
                {link.label}
              </FireText>
            ) : (
              link.label
            )}
          </a>
        );
      })}
    </nav>
  );
}
