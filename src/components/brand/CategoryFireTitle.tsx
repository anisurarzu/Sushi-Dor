"use client";

import { useEffect, useRef, useState } from "react";
import { FireText } from "@/components/brand/FireText";

type CategoryFireTitleProps = {
  id: string;
  children: string;
  className?: string;
  as?: "h2" | "h3";
};

/**
 * Category heading — FireText while this section is the active one in view.
 */
export function CategoryFireTitle({
  id,
  children,
  className = "",
  as: Tag = "h3",
}: CategoryFireTitleProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const section = el.closest("section") ?? el;

    const fromHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash === id) setActive(true);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.28) {
          setActive(true);
        } else if (!entry.isIntersecting) {
          const hash = window.location.hash.replace(/^#/, "");
          if (hash !== id) setActive(false);
        }
      },
      { rootMargin: "-18% 0px -42% 0px", threshold: [0.2, 0.28, 0.45] },
    );
    io.observe(section);

    return () => {
      window.removeEventListener("hashchange", fromHash);
      io.disconnect();
    };
  }, [id]);

  return (
    <Tag
      ref={ref}
      className={`category-fire-title ${active ? "is-active" : ""} ${className}`.trim()}
    >
      {active ? (
        <FireText sparks={28}>{children}</FireText>
      ) : (
        <span className="category-fire-title__plain">{children}</span>
      )}
    </Tag>
  );
}
