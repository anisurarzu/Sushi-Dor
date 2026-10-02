"use client";

import { useEffect, useState, type ReactNode } from "react";

type Particle = { id: number; x: number; y: number; delay: number; size: number };

export function OrderCelebration({
  title,
  subtitle,
}: {
  title: string;
  subtitle: ReactNode;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const next: Particle[] = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 8 + Math.random() * 84,
      y: 10 + Math.random() * 55,
      delay: Math.random() * 0.55,
      size: 3 + Math.random() * 5,
    }));
    setParticles(next);
  }, []);

  return (
    <div className="order-celebration relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {particles.map((p) => (
          <span
            key={p.id}
            className="order-celebration-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="order-celebration-check-wrap">
        <svg
          viewBox="0 0 64 64"
          className="order-celebration-check"
          aria-hidden
        >
          <circle
            cx="32"
            cy="32"
            r="28"
            className="order-celebration-ring"
            fill="none"
            strokeWidth="2"
          />
          <path
            d="M18 33.5 27.5 43 46 22"
            className="order-celebration-tick"
            fill="none"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <p className="order-celebration-eyebrow text-[0.7rem] uppercase tracking-[0.2em] text-gold">
        Confirmation
      </p>
      <h1 className="order-celebration-title mt-3 font-[family-name:var(--font-display)] text-4xl sm:text-5xl">
        {title}
      </h1>
      <p className="order-celebration-sub mt-4 text-[#c4bbaa]">{subtitle}</p>
    </div>
  );
}
