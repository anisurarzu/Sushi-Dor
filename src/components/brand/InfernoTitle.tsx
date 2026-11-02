import { FireText } from "@/components/brand/FireText";

/**
 * Hero brand wordmark: Sushi + flaming D'or (FireText).
 * Mark is composed outside via BrandLogo lockup.
 */
export function InfernoTitle({ className = "" }: { className?: string }) {
  return (
    <span
      className={`brand-logo brand-logo--hero brand-logo--fire notranslate ${className}`.trim()}
      translate="no"
      lang="fr"
    >
      <span className="sr-only">Sushi D&apos;or</span>
      <span className="brand-logo__sushi" aria-hidden="true">
        Sushi
      </span>
      <FireText className="brand-logo__dor" sparks={36}>
        {"D'or"}
      </FireText>
    </span>
  );
}
