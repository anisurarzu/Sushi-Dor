import { FireText } from "@/components/brand/FireText";

/**
 * Hero brand: Sushi + flaming D'or (FireText).
 */
export function InfernoTitle({ className = "" }: { className?: string }) {
  return (
    <h1
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
    </h1>
  );
}
