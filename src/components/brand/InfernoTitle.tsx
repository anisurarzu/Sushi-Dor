"use client";

import type { CSSProperties } from "react";

/**
 * Hero mark: Sushi + D'or.
 * Soft candle light inside D'or, with a few gentle flames sitting on the letter tops.
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
        <span className="dor-fire__candles">
          {CANDLES.map((c) => (
            <span
              key={c.id}
              className="dor-candle"
              style={
                {
                  left: c.left,
                  "--delay": c.delay,
                  "--dur": c.dur,
                  "--scale": c.scale,
                  "--lean": c.lean,
                } as CSSProperties
              }
            >
              <span className="dor-candle__glow" />
              <span className="dor-candle__flame" />
              <span className="dor-candle__core" />
            </span>
          ))}
        </span>
        <span className="dor-fire__fill">D&apos;or</span>
      </span>
    </h1>
  );
}

const CANDLES = [
  { id: "d1", left: "8%", delay: "0s", dur: "2.4s", scale: 1, lean: "-4deg" },
  { id: "d2", left: "22%", delay: "-0.7s", dur: "2.9s", scale: 0.85, lean: "3deg" },
  { id: "o1", left: "42%", delay: "-1.3s", dur: "2.2s", scale: 1.05, lean: "-2deg" },
  { id: "o2", left: "58%", delay: "-0.4s", dur: "3.1s", scale: 0.9, lean: "5deg" },
  { id: "r1", left: "78%", delay: "-1.8s", dur: "2.6s", scale: 0.95, lean: "-3deg" },
  { id: "r2", left: "90%", delay: "-1.1s", dur: "2.8s", scale: 0.75, lean: "2deg" },
] as const;
