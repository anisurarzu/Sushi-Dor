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
  kind: "flame" | "ember";
};

type InfernoLogoProps = {
  text?: string;
  className?: string;
  fontSize?: number;
  hero?: boolean;
};

function heroFontSize() {
  if (typeof window === "undefined") return 72;
  return Math.round(
    Math.min(115, Math.max(42, window.innerWidth * 0.11)),
  );
}

/**
 * Inferno-style title: solid 3D letterforms with roaring fire from the glyphs.
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
    let spawnPts: { x: number; y: number; edge: boolean }[] = [];
    let dpr = 1;
    let w = 0;
    let h = 0;
    let textY = 0;
    let fontSize = fontSizeProp ?? (hero ? heroFontSize() : 28);
    let font = "";
    let padX = 0;
    let ascent = 0;

    function buildFont() {
      fontSize = fontSizeProp ?? (hero ? heroFontSize() : 28);
      font = `700 ${fontSize}px "Cormorant Garamond", Georgia, "Times New Roman", serif`;
      padX = fontSize * 0.18;
    }

    function measureAndLayout() {
      if (!ctx || !canvas || !wrap) return;
      buildFont();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.font = font;
      const metrics = ctx.measureText(text);
      const textW = Math.ceil(metrics.width);
      ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
      const descent = metrics.actualBoundingBoxDescent || fontSize * 0.25;
      const flameHead = fontSize * (hero ? 1.35 : 1);
      const padY = fontSize * 0.12;

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
          if (a < 70) continue;
          const up =
            y > step ? data[((y - step) * off.width + x) * 4 + 3] : 0;
          const left =
            x > step ? data[(y * off.width + (x - step)) * 4 + 3] : 0;
          const right =
            x + step < off.width
              ? data[(y * off.width + (x + step)) * 4 + 3]
              : 0;
          const edge = up < 50 || left < 50 || right < 50;
          if (edge || a > 220) {
            spawnPts.push({
              x: x / dpr,
              y: y / dpr,
              edge: up < 50,
            });
          }
        }
      }
    }

    function spawn(n: number) {
      if (!spawnPts.length) return;
      const s = hero ? 1.35 : 1;
      for (let i = 0; i < n; i++) {
        const p = spawnPts[(Math.random() * spawnPts.length) | 0];
        const fromTop = p.edge || Math.random() > 0.55;
        if (Math.random() > 0.82) {
          particles.push({
            x: p.x + (Math.random() - 0.5) * 4,
            y: p.y - Math.random() * 4,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -(1.2 + Math.random() * 2.4) * s,
            life: 0,
            max: 50 + Math.random() * 40,
            size: 0.7 + Math.random() * 1.4,
            kind: "ember",
          });
          continue;
        }
        particles.push({
          x: p.x + (Math.random() - 0.5) * 2.5 * s,
          y: p.y + (Math.random() - 0.5) * 1.5,
          vx: (Math.random() - 0.5) * (fromTop ? 0.7 : 0.45) * s,
          vy: -(fromTop ? 1.1 : 0.55) * s - Math.random() * 1.8 * s,
          life: 0,
          max: 26 + Math.random() * (fromTop ? 38 : 24),
          size: (fromTop ? 2.2 : 1.4) + Math.random() * 3.4 * s,
          kind: "flame",
        });
      }
    }

    function flameColor(t: number): string {
      if (t < 0.12) return `rgba(255,250,230,${0.95 - t})`;
      if (t < 0.28) return `rgba(255,220,110,${0.9 - t * 0.4})`;
      if (t < 0.5) return `rgba(255,140,35,${0.82 - t * 0.35})`;
      if (t < 0.72) return `rgba(255,55,10,${0.7 - t * 0.4})`;
      return `rgba(120,15,0,${0.35 * (1 - t)})`;
    }

    function draw3DLetters() {
      if (!ctx) return;
      ctx.save();
      ctx.font = font;
      ctx.textBaseline = "alphabetic";

      // Extrusion (3D depth) — dark red-brown like Inferno
      ctx.fillStyle = "#4a1408";
      for (let i = Math.round(fontSize * 0.07); i >= 1; i--) {
        ctx.fillText(text, padX + i * 0.55, textY + i * 0.7);
      }

      // Letter face — solid red-orange, readable
      const face = ctx.createLinearGradient(
        0,
        textY - ascent,
        0,
        textY + fontSize * 0.08,
      );
      face.addColorStop(0, "#ff6b3d");
      face.addColorStop(0.35, "#e8331a");
      face.addColorStop(0.7, "#c41e0a");
      face.addColorStop(1, "#7a0f05");
      ctx.fillStyle = face;
      ctx.shadowColor = "rgba(255, 60, 0, 0.55)";
      ctx.shadowBlur = fontSize * 0.12;
      ctx.fillText(text, padX, textY);

      // Hot rim highlight on top of letters
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255, 210, 120, 0.35)";
      ctx.lineWidth = Math.max(1, fontSize * 0.018);
      ctx.strokeText(text, padX, textY);
      ctx.restore();
    }

    function frame() {
      if (!running || !ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Soft fire layer behind letters (side wrap)
      if (!reduced) {
        spawn(hero ? 22 : 12);
        ctx.globalCompositeOperation = "lighter";
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          // Draw only particles that are behind / around — not covering face yet
          if (p.y > textY - ascent * 0.35 && p.kind === "flame" && p.vy > -0.8) {
            // skip dense core cover — drawn after letters for top flames only
          }
          p.life += 1;
          p.x += p.vx + Math.sin(p.life * 0.18 + p.y * 0.03) * 0.18;
          p.y += p.vy;
          p.vy *= 0.988;
          p.vx *= 0.975;
          const t = p.life / p.max;
          if (t >= 1) {
            particles.splice(i, 1);
            continue;
          }
          const r =
            p.size *
            (p.kind === "ember" ? 1 - t * 0.7 : 1 - t * 0.45);
          ctx.beginPath();
          ctx.fillStyle =
            p.kind === "ember"
              ? `rgba(255,160,60,${0.7 * (1 - t)})`
              : flameColor(t);
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        if (particles.length > 1400) {
          particles.splice(0, particles.length - 1400);
        }
        ctx.globalCompositeOperation = "source-over";
      }

      // Solid 3D letters on top of lower fire
      draw3DLetters();

      // Top roaring flames + sparks above letter tops (after text)
      if (!reduced) {
        ctx.globalCompositeOperation = "lighter";
        for (const p of particles) {
          if (p.y >= textY - ascent * 0.55) continue;
          const t = p.life / p.max;
          if (t >= 1) continue;
          const r =
            p.size *
            (p.kind === "ember" ? 1.1 : 1.15) *
            (1 - t * 0.4);
          ctx.beginPath();
          ctx.fillStyle =
            p.kind === "ember"
              ? `rgba(255,200,90,${0.85 * (1 - t)})`
              : flameColor(t * 0.85);
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      }

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
        draw3DLetters();
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
        draw3DLetters();
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
