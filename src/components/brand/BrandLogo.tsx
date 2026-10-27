type BrandLogoProps = {
  as?: "h1" | "span" | "p";
  size?: "hero" | "header" | "footer";
  className?: string;
};

/**
 * Sushi D'or wordmark — molten-gold 3D face with ember fire shimmer.
 */
export function BrandLogo({
  as: Tag = "span",
  size = "header",
  className = "",
}: BrandLogoProps) {
  return (
    <Tag className={`brand-logo brand-logo--${size} ${className}`.trim()}>
      <span className="brand-logo__stack">
        <span className="brand-logo__depth" aria-hidden="true">
          Sushi D&apos;or
        </span>
        <span className="brand-logo__glow" aria-hidden="true">
          Sushi D&apos;or
        </span>
        <span className="brand-logo__face">
          Sushi <span className="brand-logo__accent">D&apos;or</span>
        </span>
      </span>
    </Tag>
  );
}
