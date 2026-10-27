/**
 * Hero mark: Sushi + D'or — soft 3D depth, living fire fill, fading sparks.
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
        <span className="dor-fire__depth">D&apos;or</span>
        <span className="dor-fire__fill">D&apos;or</span>
        <span className="dor-fire__sparks">
          {SPARKS.map((s) => (
            <span
              key={s.id}
              className="dor-spark"
              style={{
                left: s.left,
                bottom: s.bottom,
                animationDelay: s.delay,
                animationDuration: s.dur,
              }}
            />
          ))}
        </span>
      </span>
    </h1>
  );
}

const SPARKS = [
  { id: 1, left: "10%", bottom: "28%", delay: "0s", dur: "4.8s" },
  { id: 2, left: "22%", bottom: "40%", delay: "1.2s", dur: "5.4s" },
  { id: 3, left: "36%", bottom: "22%", delay: "0.6s", dur: "5.1s" },
  { id: 4, left: "48%", bottom: "48%", delay: "2.1s", dur: "4.6s" },
  { id: 5, left: "58%", bottom: "30%", delay: "3.4s", dur: "5.6s" },
  { id: 6, left: "70%", bottom: "44%", delay: "1.7s", dur: "4.9s" },
  { id: 7, left: "82%", bottom: "26%", delay: "2.8s", dur: "5.3s" },
  { id: 8, left: "90%", bottom: "38%", delay: "0.9s", dur: "5.8s" },
  { id: 9, left: "15%", bottom: "55%", delay: "4.1s", dur: "5.2s" },
  { id: 10, left: "64%", bottom: "18%", delay: "3.6s", dur: "4.7s" },
] as const;
