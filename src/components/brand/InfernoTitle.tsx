/**
 * Hero mark: Sushi + D'or with warm animated fill inside the letters only.
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
      <span className="dor-fire" aria-hidden="true">
        <span className="dor-fire__fill">D&apos;or</span>
      </span>
    </h1>
  );
}
