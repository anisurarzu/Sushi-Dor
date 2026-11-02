import { BrandMark } from "@/components/brand/BrandMark";
import { InfernoTitle } from "@/components/brand/InfernoTitle";

type BrandLogoProps = {
  as?: "h1" | "span" | "p";
  size?: "hero" | "header" | "footer";
  /** Animated fire inside D'or — hero title only */
  fire?: boolean;
  className?: string;
};

/**
 * Brand identity:
 * - header → transparent 3D mark only
 * - hero fire → flaming wordmark (no mark)
 * - elsewhere → text wordmark
 */
export function BrandLogo({
  as: Tag = "span",
  size = "header",
  fire = false,
  className = "",
}: BrandLogoProps) {
  if (size === "header") {
    return (
      <span
        className={`brand-lockup brand-lockup--header notranslate ${className}`.trim()}
        translate="no"
        lang="fr"
      >
        <span className="sr-only">Sushi D&apos;or</span>
        <BrandMark size="header" />
      </span>
    );
  }

  if (fire && size === "hero") {
    return <InfernoTitle className={className} />;
  }

  return (
    <Tag
      className={`brand-logo brand-logo--${size} brand-logo--plain notranslate ${className}`.trim()}
      translate="no"
      lang="fr"
    >
      <span className="brand-logo__sushi">Sushi</span>
      <span className="brand-logo__dor gold-text">D&apos;or</span>
    </Tag>
  );
}
