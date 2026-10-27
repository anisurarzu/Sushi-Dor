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
  { id: 1, left: "8%", bottom: "26%", delay: "0s", dur: "4.8s" },
  { id: 2, left: "14%", bottom: "42%", delay: "1.2s", dur: "5.4s" },
  { id: 3, left: "20%", bottom: "18%", delay: "2.5s", dur: "4.5s" },
  { id: 4, left: "26%", bottom: "50%", delay: "0.6s", dur: "5.1s" },
  { id: 5, left: "32%", bottom: "30%", delay: "3.1s", dur: "5.7s" },
  { id: 6, left: "38%", bottom: "22%", delay: "1.5s", dur: "4.9s" },
  { id: 7, left: "44%", bottom: "46%", delay: "2.1s", dur: "4.6s" },
  { id: 8, left: "50%", bottom: "34%", delay: "3.8s", dur: "5.3s" },
  { id: 9, left: "56%", bottom: "16%", delay: "0.9s", dur: "5.8s" },
  { id: 10, left: "62%", bottom: "40%", delay: "2.8s", dur: "4.7s" },
  { id: 11, left: "68%", bottom: "28%", delay: "1.7s", dur: "5.2s" },
  { id: 12, left: "74%", bottom: "52%", delay: "4.1s", dur: "5.5s" },
  { id: 13, left: "80%", bottom: "24%", delay: "3.4s", dur: "4.4s" },
  { id: 14, left: "86%", bottom: "38%", delay: "0.4s", dur: "5.6s" },
  { id: 15, left: "92%", bottom: "20%", delay: "2.3s", dur: "4.8s" },
  { id: 16, left: "11%", bottom: "58%", delay: "3.6s", dur: "5.9s" },
  { id: 17, left: "41%", bottom: "12%", delay: "1.9s", dur: "5.0s" },
  { id: 18, left: "71%", bottom: "56%", delay: "4.4s", dur: "5.4s" },
  { id: 19, left: "29%", bottom: "36%", delay: "0.3s", dur: "4.3s" },
  { id: 20, left: "59%", bottom: "44%", delay: "2.6s", dur: "5.1s" },
] as const;
