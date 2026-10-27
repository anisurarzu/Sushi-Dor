"use client";

import { useEffect, useRef } from "react";

/**
 * Hero: "Sushi" plain + "D'or" filled with animated fire (CSS clip),
 * plus live flame tongues rising above the letters (canvas).
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
      base: number;
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
      w = Math.max(2, Math.ceil(rect.width));
      // Plume band sits on the upper half of the glyph + above
      h = Math.max(2, Math.ceil(rect.height * 1.15));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(8, Math.floor(w / 28));
      tongues = Array.from({ length: count }, (_, i) => ({
        x: ((i + 0.5) / count) * w,
        base: rect.height * 0.22,
        h: rect.height * (0.35 + Math.random() * 0.55),
        w: 6 + Math.random() * 14,
        phase: Math.random() * Math.PI * 2,
        speed: 1.6 + Math.random() * 2.2,
        lean: (Math.random() - 0.5) * 0.35,
      }));
    };

    const spawnEmber = () => {
      embers.push({
        x: Math.random() * w,
        y: h * (0.55 + Math.random() * 0.25),
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(1.2 + Math.random() * 2.4),
        life: 0,
        max: 40 + Math.random() * 50,
        r: 1 + Math.random() * 2.2,
      });
    };

    const drawTongue = (tongue: Tongue, time: number) => {
      const flicker = 0.85 + 0.15 * Math.sin(time * tongue.speed + tongue.phase);
      const height = tongue.h * flicker;
      const baseY = h - tongue.base;
      const tipX =
        tongue.x +
        Math.sin(time * tongue.speed * 0.9 + tongue.phase) * tongue.w * 0.8 +
        tongue.lean * height;
      const tipY = baseY - height;

      const grad = ctx.createLinearGradient(tongue.x, baseY, tipX, tipY);
      grad.addColorStop(0, "rgba(255, 60, 0, 0)");
      grad.addColorStop(0.15, "rgba(255, 70, 0, 0.55)");
      grad.addColorStop(0.45, "rgba(255, 140, 20, 0.85)");
      grad.addColorStop(0.75, "rgba(255, 220, 90, 0.9)");
      grad.addColorStop(1, "rgba(255, 250, 220, 0.35)");

      ctx.beginPath();
      ctx.moveTo(tongue.x - tongue.w * 0.55, baseY);
      ctx.quadraticCurveTo(
        tongue.x - tongue.w * 0.2 + Math.sin(time + tongue.phase) * 4,
        baseY - height * 0.45,
        tipX,
        tipY,
      );
      ctx.quadraticCurveTo(
        tongue.x + tongue.w * 0.2 - Math.sin(time + tongue.phase) * 4,
        baseY - height * 0.45,
        tongue.x + tongue.w * 0.55,
        baseY,
      );
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Hot core
      ctx.beginPath();
      ctx.moveTo(tongue.x - tongue.w * 0.18, baseY);
      ctx.quadraticCurveTo(
        tongue.x,
        tipY + height * 0.25,
        tipX,
        tipY + height * 0.12,
      );
      ctx.quadraticCurveTo(
        tongue.x,
        tipY + height * 0.25,
        tongue.x + tongue.w * 0.18,
        baseY,
      );
      ctx.closePath();
      ctx.fillStyle = "rgba(255, 245, 180, 0.55)";
      ctx.fill();
    };

    const draw = () => {
      if (!running) return;
      t += 0.05;
      ctx.clearRect(0, 0, w, h);

      ctx.globalCompositeOperation = "lighter";
      for (const tongue of tongues) {
        drawTongue(tongue, t);
      }

      if (embers.length < 28 && Math.random() > 0.55) spawnEmber();
      embers = embers.filter((e) => e.life < e.max);
      for (const e of embers) {
        e.life += 1;
        e.x += e.vx + Math.sin(t + e.y) * 0.15;
        e.y += e.vy;
        const a = 1 - e.life / e.max;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * a, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, ${180 + ((1 - a) * 60) | 0}, 80, ${0.85 * a})`;
        ctx.fill();
      }
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
      className={`brand-logo brand-logo--hero brand-logo--fire ${className}`.trim()}
    >
      <span className="sr-only">Sushi D&apos;or</span>
      <span className="brand-logo__sushi" aria-hidden="true">
        Sushi{"\u00A0"}
      </span>
      <span ref={wrapRef} className="dor-fire" aria-hidden="true">
        <canvas ref={canvasRef} className="dor-fire__canvas" />
        <span className="dor-fire__fill">D&apos;or</span>
      </span>
    </h1>
  );
}
