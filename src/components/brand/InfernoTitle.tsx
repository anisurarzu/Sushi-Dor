"use client";

import { useEffect, useRef } from "react";

/**
 * Hero: "Sushi" + "D'or" on one baseline.
 * Fire fills D'or and rises bottom → top, with tongues above the letters.
 * Brand is not translated (D'or must not become "Gold").
 */
export function InfernoTitle({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;
    let t = 0;

    type Tongue = {
      x: number;
      h: number;
      w: number;
      phase: number;
      speed: number;
      lean: number;
    };
    let tongues: Tongue[] = [];

    type Ember = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      max: number;
      r: number;
    };
    let embers: Ember[] = [];

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      w = Math.max(2, Math.ceil(rect.width * 1.08));
      // Full glyph height + extra headroom so flames climb out the top
      h = Math.max(2, Math.ceil(rect.height * 1.75));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(10, Math.floor(w / 22));
      tongues = Array.from({ length: count }, (_, i) => ({
        x: ((i + 0.5) / count) * w,
        h: h * (0.55 + Math.random() * 0.4),
        w: 7 + Math.random() * 16,
        phase: Math.random() * Math.PI * 2,
        speed: 1.8 + Math.random() * 2.4,
        lean: (Math.random() - 0.5) * 0.4,
      }));
    };

    const spawnEmber = () => {
      // Start near letter bottom, drift upward
      embers.push({
        x: w * 0.08 + Math.random() * w * 0.84,
        y: h * (0.72 + Math.random() * 0.2),
        vx: (Math.random() - 0.5) * 0.7,
        vy: -(1.6 + Math.random() * 2.8),
        life: 0,
        max: 45 + Math.random() * 55,
        r: 1.1 + Math.random() * 2.4,
      });
    };

    const drawTongue = (tongue: Tongue, time: number) => {
      const flicker =
        0.82 + 0.18 * Math.sin(time * tongue.speed + tongue.phase);
      const height = tongue.h * flicker;
      // Root at bottom of canvas (letter feet) → tip toward / past top
      const baseY = h * 0.94;
      const tipX =
        tongue.x +
        Math.sin(time * tongue.speed * 0.9 + tongue.phase) * tongue.w * 0.85 +
        tongue.lean * height;
      const tipY = baseY - height;

      const grad = ctx.createLinearGradient(tongue.x, baseY, tipX, tipY);
      grad.addColorStop(0, "rgba(180, 30, 0, 0)");
      grad.addColorStop(0.12, "rgba(255, 60, 0, 0.5)");
      grad.addColorStop(0.4, "rgba(255, 120, 10, 0.9)");
      grad.addColorStop(0.7, "rgba(255, 210, 70, 0.95)");
      grad.addColorStop(1, "rgba(255, 250, 220, 0.4)");

      ctx.beginPath();
      ctx.moveTo(tongue.x - tongue.w * 0.55, baseY);
      ctx.quadraticCurveTo(
        tongue.x - tongue.w * 0.15 + Math.sin(time + tongue.phase) * 5,
        baseY - height * 0.42,
        tipX,
        tipY,
      );
      ctx.quadraticCurveTo(
        tongue.x + tongue.w * 0.15 - Math.sin(time + tongue.phase) * 5,
        baseY - height * 0.42,
        tongue.x + tongue.w * 0.55,
        baseY,
      );
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(tongue.x - tongue.w * 0.16, baseY);
      ctx.quadraticCurveTo(
        tongue.x,
        tipY + height * 0.28,
        tipX,
        tipY + height * 0.1,
      );
      ctx.quadraticCurveTo(
        tongue.x,
        tipY + height * 0.28,
        tongue.x + tongue.w * 0.16,
        baseY,
      );
      ctx.closePath();
      ctx.fillStyle = "rgba(255, 245, 190, 0.6)";
      ctx.fill();
    };

    const draw = () => {
      if (!running) return;
      t += 0.055;
      ctx.clearRect(0, 0, w, h);

      ctx.globalCompositeOperation = "lighter";
      for (const tongue of tongues) {
        drawTongue(tongue, t);
      }

      if (embers.length < 32 && Math.random() > 0.5) spawnEmber();
      const nextEmbers: typeof embers = [];
      for (const e of embers) {
        e.life += 1;
        e.x += e.vx + Math.sin(t * 2 + e.y * 0.05) * 0.2;
        e.y += e.vy;
        if (e.life >= e.max || e.y < -10) continue;
        const a = Math.max(0, 1 - e.life / e.max);
        const radius = Math.max(0, e.r * a);
        if (radius <= 0) continue;
        ctx.beginPath();
        ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, ${170 + ((1 - a) * 70) | 0}, 70, ${0.9 * a})`;
        ctx.fill();
        nextEmbers.push(e);
      }
      embers = nextEmbers;
      ctx.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(draw);
    };

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);
    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

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
      <span ref={wrapRef} className="dor-fire" aria-hidden="true">
        <canvas ref={canvasRef} className="dor-fire__canvas" />
        <span className="dor-fire__fill">D&apos;or</span>
      </span>
    </h1>
  );
}
