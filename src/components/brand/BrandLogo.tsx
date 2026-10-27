import { InfernoTitle } from "@/components/brand/InfernoTitle";

type BrandLogoProps = {
  as?: "h1" | "span" | "p";
  size?: "hero" | "header" | "footer";
  /** Photoreal Inferno fire — hero title only */
  fire?: boolean;
  className?: string;
};

/**
 * Brand wordmark. Hero fire uses Inferno title art; header/footer stay clean.
 */
export function BrandLogo({
  as: Tag = "span",
  size = "header",
  fire = false,
  className = "",
}: BrandLogoProps) {
  if (fire && size === "hero") {
    return <InfernoTitle className={className} />;
  }

  return (
    <Tag
      className={`brand-logo brand-logo--${size} brand-logo--plain ${className}`.trim()}
    >
      Sushi <span className="gold-text">D&apos;or</span>
    </Tag>
  );
}
