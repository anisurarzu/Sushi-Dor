"use client";

import type { CSSProperties } from "react";

type BrandLogoProps = {
  as?: "h1" | "span" | "p";
  size?: "hero" | "header" | "footer";
  className?: string;
};

const FLAME_COUNT = {
  hero: 18,
  header: 10,
  footer: 10,
} as const;

/**
 * Sushi D'or wordmark with real flame tongues burning along the letter tops.
 */
export function BrandLogo({
  as: Tag = "span",
  size = "header",
  className = "",
}: BrandLogoProps) {
  const count = FLAME_COUNT[size];

  return (
    <Tag className={`brand-logo brand-logo--${size} ${className}`.trim()}>
      <span className="brand-logo__stage">
        <span className="brand-logo__flames" aria-hidden="true">
          {Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              className="brand-logo__flame"
              style={
                {
                  "--i": i,
                  "--n": count,
                  left: `${((i + 0.5) / count) * 100}%`,
                  animationDelay: `${(i % 7) * -0.28}s`,
                  animationDuration: `${0.85 + (i % 5) * 0.18}s`,
                } as CSSProperties
              }
            />
          ))}
        </span>
        <span className="brand-logo__embers" aria-hidden="true">
          {Array.from({ length: size === "hero" ? 14 : 6 }, (_, i) => (
            <span
              key={i}
              className="brand-logo__ember"
              style={
                {
                  "--i": i,
                  left: `${8 + ((i * 17) % 84)}%`,
                  animationDelay: `${i * -0.35}s`,
                  animationDuration: `${2.2 + (i % 4) * 0.4}s`,
                } as CSSProperties
              }
            />
          ))}
        </span>
        <span className="brand-logo__face">
          Sushi <span className="brand-logo__fire">D&apos;or</span>
        </span>
      </span>
    </Tag>
  );
}
