type BrandMarkProps = {
  size?: "hero" | "header" | "footer";
  className?: string;
};

const SPARKS = [
  { id: 1, left: "18%", bottom: "35%", delay: "0s", dur: "2.8s" },
  { id: 2, left: "32%", bottom: "48%", delay: "0.4s", dur: "3.2s" },
  { id: 3, left: "48%", bottom: "58%", delay: "0.9s", dur: "2.6s" },
  { id: 4, left: "62%", bottom: "42%", delay: "1.3s", dur: "3.4s" },
  { id: 5, left: "74%", bottom: "30%", delay: "0.2s", dur: "2.9s" },
  { id: 6, left: "28%", bottom: "22%", delay: "1.7s", dur: "3.1s" },
  { id: 7, left: "55%", bottom: "28%", delay: "2.1s", dur: "2.7s" },
  { id: 8, left: "40%", bottom: "62%", delay: "0.7s", dur: "3.5s" },
  { id: 9, left: "68%", bottom: "55%", delay: "1.5s", dur: "3.0s" },
  { id: 10, left: "22%", bottom: "50%", delay: "2.4s", dur: "2.5s" },
  { id: 11, left: "80%", bottom: "40%", delay: "1.1s", dur: "3.3s" },
  { id: 12, left: "12%", bottom: "38%", delay: "1.9s", dur: "2.8s" },
] as const;

/**
 * Gold mark — flat orbit (no 3D depth/shadow ghost) + sparks from the emblem.
 */
export function BrandMark({ size = "header", className = "" }: BrandMarkProps) {
  return (
    <span
      className={`brand-mark brand-mark--${size} ${className}`.trim()}
      aria-hidden="true"
    >
      <span className="brand-mark__stage">
        <img
          src="/brand/sushi-dor-mark.png?v=7"
          alt=""
          className="brand-mark__img"
          width={891}
          height={516}
          decoding="async"
          fetchPriority="high"
        />
        <span className="brand-mark__sparks">
          {SPARKS.map((s) => (
            <span
              key={s.id}
              className="brand-mark__spark"
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
    </span>
  );
}
