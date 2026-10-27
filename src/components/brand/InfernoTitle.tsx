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
  { id: 1, left: "6%", bottom: "24%", delay: "0s", dur: "4.8s" },
  { id: 2, left: "10%", bottom: "40%", delay: "1.2s", dur: "5.4s" },
  { id: 3, left: "14%", bottom: "16%", delay: "2.5s", dur: "4.5s" },
  { id: 4, left: "18%", bottom: "52%", delay: "0.6s", dur: "5.1s" },
  { id: 5, left: "22%", bottom: "30%", delay: "3.1s", dur: "5.7s" },
  { id: 6, left: "26%", bottom: "44%", delay: "1.5s", dur: "4.9s" },
  { id: 7, left: "30%", bottom: "20%", delay: "2.1s", dur: "4.6s" },
  { id: 8, left: "34%", bottom: "48%", delay: "3.8s", dur: "5.3s" },
  { id: 9, left: "38%", bottom: "28%", delay: "0.9s", dur: "5.8s" },
  { id: 10, left: "42%", bottom: "56%", delay: "2.8s", dur: "4.7s" },
  { id: 11, left: "46%", bottom: "18%", delay: "1.7s", dur: "5.2s" },
  { id: 12, left: "50%", bottom: "36%", delay: "4.1s", dur: "5.5s" },
  { id: 13, left: "54%", bottom: "50%", delay: "3.4s", dur: "4.4s" },
  { id: 14, left: "58%", bottom: "22%", delay: "0.4s", dur: "5.6s" },
  { id: 15, left: "62%", bottom: "42%", delay: "2.3s", dur: "4.8s" },
  { id: 16, left: "66%", bottom: "14%", delay: "3.6s", dur: "5.9s" },
  { id: 17, left: "70%", bottom: "34%", delay: "1.9s", dur: "5.0s" },
  { id: 18, left: "74%", bottom: "54%", delay: "4.4s", dur: "5.4s" },
  { id: 19, left: "78%", bottom: "26%", delay: "0.3s", dur: "4.3s" },
  { id: 20, left: "82%", bottom: "46%", delay: "2.6s", dur: "5.1s" },
  { id: 21, left: "86%", bottom: "32%", delay: "1.1s", dur: "5.7s" },
  { id: 22, left: "90%", bottom: "12%", delay: "3.9s", dur: "4.6s" },
  { id: 23, left: "94%", bottom: "38%", delay: "2.0s", dur: "5.3s" },
  { id: 24, left: "8%", bottom: "58%", delay: "4.7s", dur: "5.2s" },
  { id: 25, left: "16%", bottom: "34%", delay: "0.8s", dur: "4.9s" },
  { id: 26, left: "28%", bottom: "10%", delay: "3.2s", dur: "5.5s" },
  { id: 27, left: "40%", bottom: "40%", delay: "1.4s", dur: "4.5s" },
  { id: 28, left: "52%", bottom: "28%", delay: "2.9s", dur: "5.8s" },
  { id: 29, left: "64%", bottom: "52%", delay: "0.2s", dur: "4.7s" },
  { id: 30, left: "76%", bottom: "18%", delay: "3.5s", dur: "5.1s" },
  { id: 31, left: "88%", bottom: "48%", delay: "1.6s", dur: "5.4s" },
  { id: 32, left: "24%", bottom: "60%", delay: "4.2s", dur: "4.8s" },
  { id: 33, left: "48%", bottom: "8%", delay: "2.4s", dur: "5.6s" },
  { id: 34, left: "72%", bottom: "36%", delay: "0.7s", dur: "5.0s" },
  { id: 35, left: "12%", bottom: "22%", delay: "3.0s", dur: "4.4s" },
  { id: 36, left: "84%", bottom: "58%", delay: "1.8s", dur: "5.9s" },
] as const;
