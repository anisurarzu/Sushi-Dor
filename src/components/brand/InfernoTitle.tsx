"use client";

/**
 * Photoreal Inferno-style hero title (image + live ember glow).
 * Canvas particles cannot match this look — use the rendered mark.
 */
export function InfernoTitle({ className = "" }: { className?: string }) {
  return (
    <h1 className={`inferno-title ${className}`.trim()}>
      <span className="sr-only">Sushi D&apos;or</span>
      <span className="inferno-title__stage" aria-hidden="true">
        <img
          src="/brand/sushi-dor-inferno-title.jpg"
          alt=""
          className="inferno-title__img"
          width={1920}
          height={1080}
          decoding="async"
          fetchPriority="high"
        />
        <span className="inferno-title__heat" />
        <span className="inferno-title__sparks">
          {Array.from({ length: 12 }, (_, i) => (
            <span
              key={i}
              className="inferno-title__spark"
              style={{
                left: `${8 + ((i * 7.3) % 84)}%`,
                animationDelay: `${-i * 0.45}s`,
                animationDuration: `${2.4 + (i % 5) * 0.35}s`,
              }}
            />
          ))}
        </span>
      </span>
    </h1>
  );
}
