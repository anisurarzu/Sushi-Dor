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
  fontSize?: number;
  hero?: boolean;
};

function heroFontSize() {
  if (typeof window === "undefined") return 72;
  const vw = window.innerWidth;
  return Math.round(Math.min(115, Math.max(42, vw * 0.11)));
}

/**
 * Soft Inferno fire on letter tops — text stays clear and readable.
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
      padX = fontSize * 0.15;
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
      // Smaller flame head — less empty “shadow” block above
      const flameHead = fontSize * (hero ? 0.85 : 0.7);
      const padY = fontSize * 0.08;

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
      const step = Math.max(3, Math.floor((hero ? 4 : 3) * dpr));
      for (let y = 0; y < off.height; y += step) {
        for (let x = 0; x < off.width; x += step) {
          const a = data[(y * off.width + x) * 4 + 3];
          if (a < 80) continue;
          const up =
            y > step ? data[((y - step) * off.width + x) * 4 + 3] : 0;
          // Only true top silhouette — keeps letter faces clean
          if (up < 40) {
            spawnPts.push({ x: x / dpr, y: y / dpr });
          }
        }
      }
      if (spawnPts.length < 12) {
        for (let i = 0; i < 40; i++) {
          spawnPts.push({
            x: padX + (textW * i) / 40,
            y: textY - ascent * 0.92,
          });
        }
      }
    }

    function spawn(n: number) {
      if (!spawnPts.length) return;
      for (let i = 0; i < n; i++) {
        const p = spawnPts[(Math.random() * spawnPts.length) | 0];
        particles.push({
          x: p.x + (Math.random() - 0.5) * 1.8,
          y: p.y + (Math.random() - 0.5) * 1.2,
          vx: (Math.random() - 0.5) * 0.35,
          vy: -(0.35 + Math.random() * 0.9),
          life: 0,
          max: 40 + Math.random() * 36,
          size: 1.1 + Math.random() * 2.2,
        });
      }
    }

    function colorFor(t: number): string {
      // Softer, lower opacity so letters stay readable
      if (t < 0.2) return `rgba(255,244,200,${0.55 * (1 - t)})`;
      if (t < 0.45) return `rgba(255,190,90,${0.42 * (1 - t * 0.5)})`;
      if (t < 0.7) return `rgba(255,120,40,${0.28 * (1 - t * 0.4)})`;
      return `rgba(200,60,10,${0.12 * (1 - t)})`;
    }

    function drawLetters() {
      if (!ctx) return;
      ctx.save();
      ctx.font = font;
      ctx.textBaseline = "alphabetic";
      // Crisp readable face — champagne/gold, no heavy glow blob
      const fill = ctx.createLinearGradient(
        0,
        textY - fontSize * 0.9,
        0,
        textY,
      );
      fill.addColorStop(0, "#fff4d6");
      fill.addColorStop(0.45, "#e8c878");
      fill.addColorStop(1, "#c4a35a");
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.strokeStyle = "rgba(12,10,8,0.45)";
      ctx.lineWidth = Math.max(1.5, fontSize * 0.022);
      ctx.strokeText(text, padX, textY);
      ctx.fillStyle = fill;
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.fillText(text, padX, textY);
      ctx.restore();
    }

    function frame() {
      if (!running || !ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Fire first (behind / on tops), soft
      if (!reduced) {
        spawn(hero ? 10 : 6);
        ctx.globalCompositeOperation = "lighter";
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life += 1;
          p.x += p.vx + Math.sin(p.life * 0.12 + p.y * 0.03) * 0.1;
          p.y += p.vy;
          p.vy *= 0.995;
          p.vx *= 0.985;
          const t = p.life / p.max;
          if (t >= 1) {
            particles.splice(i, 1);
            continue;
          }
          const r = p.size * (1 - t * 0.6);
          ctx.beginPath();
          ctx.fillStyle = colorFor(t);
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        if (particles.length > 420) particles.splice(0, particles.length - 420);
        ctx.globalCompositeOperation = "source-over";
      }

      // Letters on top — always legible
      drawLetters();

      raf = requestAnimationFrame(frame);
    }

    let started = false;
    function start() {
      if (started) return;
      started = true;
      measureAndLayout();
      if (reduced) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        drawLetters();
      } else {
        frame();
      }
    }

    const fontsReady = document.fonts?.ready;
    if (fontsReady) {
      void fontsReady.then(start);
      window.setTimeout(start, 400);
    } else {
      start();
    }

    const onResize = () => {
      particles.length = 0;
      measureAndLayout();
      if (reduced) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        drawLetters();
      }
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
