"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
};

type InfernoLogoProps = {
  text?: string;
  className?: string;
  /** Fixed size; omit for responsive hero sizing */
  fontSize?: number;
  /** Large hero title mode */
  hero?: boolean;
};

function heroFontSize() {
  if (typeof window === "undefined") return 72;
  const vw = window.innerWidth;
  // mirror clamp(2.6rem, 11vw, 7.2rem)
  return Math.round(Math.min(115, Math.max(42, vw * 0.11)));
}

/**
 * Cinematic per-letter fire (INFERNO-style): particles rise from each glyph.
 */
export function InfernoLogo({
  text = "Sushi D'or",
  className = "",
  fontSize: fontSizeProp,
  hero = false,
}: InfernoLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf = 0;
    let running = true;
    const particles: Particle[] = [];
    let spawnPts: { x: number; y: number }[] = [];
    let dpr = 1;
    let w = 0;
    let h = 0;
    let textY = 0;
    let fontSize = fontSizeProp ?? (hero ? heroFontSize() : 28);
    let font = "";
    let padX = 0;

    function buildFont() {
      fontSize = fontSizeProp ?? (hero ? heroFontSize() : 28);
      font = `600 ${fontSize}px "Cormorant Garamond", Georgia, "Times New Roman", serif`;
      padX = fontSize * 0.2;
    }

    function measureAndLayout() {
      if (!ctx || !canvas || !wrap) return;
      buildFont();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.font = font;
      const metrics = ctx.measureText(text);
      const textW = Math.ceil(metrics.width);
      const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
      const descent = metrics.actualBoundingBoxDescent || fontSize * 0.25;
      const flameHead = fontSize * (hero ? 1.55 : 1.25);
      const padY = fontSize * 0.15;

      w = Math.min(window.innerWidth - 32, textW + padX * 2);
      h = ascent + descent + flameHead + padY;
      textY = flameHead + ascent;

      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      wrap.style.width = `${w}px`;
      wrap.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const off = document.createElement("canvas");
      off.width = canvas.width;
      off.height = canvas.height;
      const octx = off.getContext("2d");
      if (!octx) return;
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
      octx.font = font;
      octx.textBaseline = "alphabetic";
      octx.fillStyle = "#fff";
      octx.fillText(text, padX, textY);
      const data = octx.getImageData(0, 0, off.width, off.height).data;

      spawnPts = [];
      const step = Math.max(2, Math.floor((hero ? 3 : 2) * dpr));
      for (let y = 0; y < off.height; y += step) {
        for (let x = 0; x < off.width; x += step) {
          const a = data[(y * off.width + x) * 4 + 3];
          if (a < 50) continue;
          const up =
            y > step ? data[((y - step) * off.width + x) * 4 + 3] : 0;
          // Top rim + dense body → fire wraps the letter
          if (up < 50 || a > 200) {
            spawnPts.push({ x: x / dpr, y: y / dpr });
          }
        }
      }
      if (spawnPts.length < 20) {
        for (let i = 0; i < 60; i++) {
          spawnPts.push({
            x: padX + (textW * i) / 60,
            y: textY - ascent * (0.3 + Math.random() * 0.5),
          });
        }
      }
    }

    function spawn(n: number) {
      if (!spawnPts.length) return;
      const scale = hero ? 1.6 : 1;
      for (let i = 0; i < n; i++) {
        const p = spawnPts[(Math.random() * spawnPts.length) | 0];
        particles.push({
          x: p.x + (Math.random() - 0.5) * 3 * scale,
          y: p.y + (Math.random() - 0.5) * 2 * scale,
          vx: (Math.random() - 0.5) * 0.7 * scale,
          vy: -(0.8 + Math.random() * 2.2) * scale,
          life: 0,
          max: 32 + Math.random() * (hero ? 48 : 34),
          size: (1.6 + Math.random() * 3.8) * scale,
        });
      }
    }

    function colorFor(t: number): string {
      if (t < 0.15) return `rgba(255,252,230,${1 - t * 0.15})`;
      if (t < 0.35) return `rgba(255,215,90,${0.98 - t * 0.25})`;
      if (t < 0.55) return `rgba(255,130,30,${0.9 - t * 0.35})`;
      if (t < 0.75) return `rgba(230,50,8,${0.65 - (t - 0.55)})`;
      return `rgba(70,8,0,${0.28 * (1 - t)})`;
    }

    function drawStatic() {
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.font = font;
      ctx.textBaseline = "alphabetic";
      const fill = ctx.createLinearGradient(0, textY - fontSize, 0, textY);
      fill.addColorStop(0, "#fff3c4");
      fill.addColorStop(0.4, "#ffb84a");
      fill.addColorStop(1, "#ff4e12");
      ctx.fillStyle = fill;
      ctx.shadowColor = "rgba(255,80,10,0.75)";
      ctx.shadowBlur = fontSize * 0.25;
      ctx.fillText(text, padX, textY);
    }

    function frame() {
      if (!running || !ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const under = ctx.createRadialGradient(
        w * 0.5,
        textY,
        fontSize * 0.1,
        w * 0.5,
        textY,
        w * 0.55,
      );
      under.addColorStop(0, "rgba(255,90,20,0.28)");
      under.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = under;
      ctx.fillRect(0, textY - fontSize * 0.4, w, fontSize * 0.9);

      ctx.save();
      ctx.font = font;
      ctx.textBaseline = "alphabetic";
      const fill = ctx.createLinearGradient(
        0,
        textY - fontSize * 0.95,
        0,
        textY + fontSize * 0.1,
      );
      fill.addColorStop(0, "#fff8d6");
      fill.addColorStop(0.3, "#ffc45a");
      fill.addColorStop(0.6, "#ff6e1c");
      fill.addColorStop(1, "#7a1200");
      ctx.fillStyle = fill;
      ctx.shadowColor = "rgba(255,90,15,0.9)";
      ctx.shadowBlur = fontSize * 0.28;
      ctx.fillText(text, padX, textY);
      ctx.restore();

      if (!reduced) {
        const burst = hero
          ? Math.min(55, 18 + ((spawnPts.length / 25) | 0))
          : Math.min(28, 8 + ((spawnPts.length / 40) | 0));
        spawn(burst);
        ctx.globalCompositeOperation = "lighter";
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life += 1;
          p.x += p.vx + Math.sin(p.life * 0.22 + p.y * 0.04) * 0.2;
          p.y += p.vy;
          p.vy *= 0.991;
          p.vx *= 0.978;
          const t = p.life / p.max;
          if (t >= 1) {
            particles.splice(i, 1);
            continue;
          }
          const r = p.size * (1 - t * 0.5);
          ctx.beginPath();
          ctx.fillStyle = colorFor(t);
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        const cap = hero ? 1800 : 900;
        if (particles.length > cap) particles.splice(0, particles.length - cap);
        ctx.globalCompositeOperation = "source-over";
      }

      raf = requestAnimationFrame(frame);
    }

    let started = false;
    function start() {
      if (started) return;
      started = true;
      measureAndLayout();
      if (reduced) drawStatic();
      else frame();
    }

    const fontsReady = document.fonts?.ready;
    if (fontsReady) {
      void fontsReady.then(start);
      // fallback if fonts hang
      window.setTimeout(start, 400);
    } else {
      start();
    }

    const onResize = () => {
      particles.length = 0;
      measureAndLayout();
      if (reduced) drawStatic();
    };
    window.addEventListener("resize", onResize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [text, fontSizeProp, hero]);

  return (
    <span
      ref={wrapRef}
      className={`inferno-logo ${className}`.trim()}
      role="img"
      aria-label={text}
    >
      <canvas ref={canvasRef} className="inferno-logo__canvas" />
    </span>
  );
}
