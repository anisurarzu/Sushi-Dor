import { BrandMark } from "@/components/brand/BrandMark";
import { InfernoTitle } from "@/components/brand/InfernoTitle";

type BrandLogoProps = {
  as?: "h1" | "span" | "p";
  size?: "hero" | "header" | "footer";
  /** Animated fire inside D'or — hero title only */
  fire?: boolean;
  /** Show 3D animated fish mark beside the wordmark */
  mark?: boolean;
  className?: string;
};

/**
 * Brand wordmark. Never translate "Sushi D'or" (browsers turn D'or → Gold).
 */
export function BrandLogo({
  as: Tag = "span",
  size = "header",
  fire = false,
  mark = true,
  className = "",
}: BrandLogoProps) {
  if (fire && size === "hero") {
    return (
      <span className={`brand-lockup brand-lockup--hero ${className}`.trim()}>
        {mark ? <BrandMark size="hero" /> : null}
        <InfernoTitle />
      </span>
    );
  }

  return (
    <Tag
      className={`brand-lockup brand-lockup--${size} brand-logo brand-logo--${size} brand-logo--plain notranslate ${className}`.trim()}
      translate="no"
      lang="fr"
    >
      {mark ? <BrandMark size={size} /> : null}
      <span className="brand-logo__wordmark">
        <span className="brand-logo__sushi">Sushi</span>
        <span className="brand-logo__dor gold-text">D&apos;or</span>
      </span>
    </Tag>
  );
}
