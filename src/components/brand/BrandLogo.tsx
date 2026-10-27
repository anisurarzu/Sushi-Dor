import { InfernoLogo } from "@/components/brand/InfernoLogo";

type BrandLogoProps = {
  as?: "h1" | "span" | "p";
  size?: "hero" | "header" | "footer";
  /** INFERNO fire — hero big title only */
  fire?: boolean;
  className?: string;
};

/**
 * Brand wordmark. Fire only on the large hero title.
 */
export function BrandLogo({
  as: Tag = "span",
  size = "header",
  fire = false,
  className = "",
}: BrandLogoProps) {
  if (fire && size === "hero") {
    return (
      <Tag
        className={`brand-logo brand-logo--hero brand-logo--inferno ${className}`.trim()}
      >
        <InfernoLogo text="Sushi D'or" hero />
      </Tag>
    );
  }

  return (
    <Tag
      className={`brand-logo brand-logo--${size} brand-logo--plain ${className}`.trim()}
    >
      Sushi <span className="gold-text">D&apos;or</span>
    </Tag>
  );
}
