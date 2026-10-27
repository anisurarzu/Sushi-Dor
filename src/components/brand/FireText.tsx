type FireTextProps = {
  children: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  /** Soft 3D extrusion behind the fill */
  depth?: boolean;
  /** Number of rising sparks (0–48) */
  sparks?: number;
};

/**
 * Reusable living-fire text: soft 3D depth, animated inner fill, fading sparks.
 * Use on any label — brand, category titles, etc.
 */
export function FireText({
  children,
  className = "",
  as: Tag = "span",
  depth = true,
  sparks = 24,
}: FireTextProps) {
  const sparkCount = Math.max(0, Math.min(48, sparks));
  const list = sparkCount > 0 ? buildSparks(sparkCount, children) : [];

  return (
    <Tag className={`fire-text ${className}`.trim()}>
      <span className="sr-only">{children}</span>
      <span className="fire-text__visual" aria-hidden="true">
        {depth ? <span className="fire-text__depth">{children}</span> : null}
        <span className="fire-text__fill">{children}</span>
        {list.length > 0 ? (
          <span className="fire-text__sparks">
            {list.map((s) => (
              <span
                key={s.id}
                className="fire-spark"
                style={{
                  left: s.left,
                  bottom: s.bottom,
                  animationDelay: s.delay,
                  animationDuration: s.dur,
                }}
              />
            ))}
          </span>
        ) : null}
      </span>
    </Tag>
  );
}

function buildSparks(count: number, seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;

  return Array.from({ length: count }, (_, i) => {
    h = (h * 1664525 + 1013904223) >>> 0;
    const left = 4 + ((h % 920) / 10);
    h = (h * 1664525 + 1013904223) >>> 0;
    const bottom = 8 + (h % 55);
    h = (h * 1664525 + 1013904223) >>> 0;
    const delay = ((h % 50) / 10).toFixed(1);
    h = (h * 1664525 + 1013904223) >>> 0;
    const dur = (4.2 + (h % 18) / 10).toFixed(1);
    return {
      id: i,
      left: `${left}%`,
      bottom: `${bottom}%`,
      delay: `${delay}s`,
      dur: `${dur}s`,
    };
  });
}
