"use client";

import { useEffect, useRef } from "react";

/**
 * Hero mark: "Sushi" plain + "D'or" filled with live fire (clipped to letters only).
 */
export function InfernoTitle({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ghostRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ghost = ghostRef.current;
    if (!canvas || !ghost) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf = 0;
    let running = true;
    let fireW = 0;
    let fireH = 0;
    let heat: Float32Array | null = null;
    let texture: HTMLImageElement | null = null;
    let texReady = false;
    let texOffset = 0;
    let fireBuf: HTMLCanvasElement | null = null;
    let fireCtx: CanvasRenderingContext2D | null = null;
    let imgData: ImageData | null = null;

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      texture = img;
      texReady = true;
    };
    img.src = "/brand/fire-fill.jpg";

    const palette = buildPalette();

    const resize = () => {
      const rect = ghost.getBoundingClientRect();
      const w = Math.max(2, Math.ceil(rect.width));
      const h = Math.max(2, Math.ceil(rect.height * 1.28));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      fireW = Math.max(56, Math.floor(w / 2.5));
      fireH = Math.max(36, Math.floor(h / 2.5));
      heat = new Float32Array(fireW * fireH);
      fireBuf = document.createElement("canvas");
      fireBuf.width = fireW;
      fireBuf.height = fireH;
      fireCtx = fireBuf.getContext("2d");
      imgData = fireCtx ? fireCtx.createImageData(fireW, fireH) : null;
    };

    const stepFire = () => {
      if (!heat) return;
      const w = fireW;
      const h = fireH;

      for (let x = 0; x < w; x++) {
        const edge = Math.min(x, w - 1 - x) / (w * 0.5);
        const boost = 0.5 + 0.5 * Math.max(0, Math.min(1, edge + 0.15));
        heat[(h - 1) * w + x] = (0.7 + Math.random() * 0.3) * boost;
        if (Math.random() > 0.88) {
          heat[(h - 2) * w + x] = 0.5 + Math.random() * 0.5;
        }
      }

      for (let y = 0; y < h - 1; y++) {
        for (let x = 0; x < w; x++) {
          const below =
            heat[(y + 1) * w + x] * 0.34 +
            heat[(y + 1) * w + ((x - 1 + w) % w)] * 0.26 +
            heat[(y + 1) * w + ((x + 1) % w)] * 0.26 +
            (y + 2 < h ? heat[(y + 2) * w + x] * 0.14 : 0);
          const wind = (Math.random() - 0.5) * 0.045;
          heat[y * w + x] = Math.max(
            0,
            below * (0.965 + wind) - Math.random() * 0.022,
          );
        }
      }
    };

    const fillTextClip = (cssW: number, cssH: number) => {
      const styles = getComputedStyle(ghost);
      ctx.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      const metrics = ctx.measureText("D'or");
      const ascent =
        metrics.actualBoundingBoxAscent || parseFloat(styles.fontSize) * 0.72;
      const descent = metrics.actualBoundingBoxDescent || 0;
      const textW = metrics.width;
      const textX = (cssW - textW) / 2;
      const baseline = (cssH + ascent - descent) / 2;
      return { textX, baseline, styles };
    };

    const paintStatic = () => {
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      ctx.clearRect(0, 0, cssW, cssH);
      const { textX, baseline, styles } = fillTextClip(cssW, cssH);
      const grad = ctx.createLinearGradient(0, 0, 0, cssH);
      grad.addColorStop(0, "#fff6b0");
      grad.addColorStop(0.35, "#ff8a1a");
      grad.addColorStop(0.7, "#d02000");
      grad.addColorStop(1, "#4a0800");
      ctx.fillStyle = grad;
      ctx.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
      ctx.textBaseline = "alphabetic";
      ctx.fillText("D'or", textX, baseline);
    };

    const draw = () => {
      if (!running || !heat || !fireBuf || !fireCtx || !imgData) return;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      ctx.clearRect(0, 0, cssW, cssH);

      stepFire();
      texOffset = (texOffset + 1.1) % 1000;

      const data = imgData.data;
      for (let i = 0; i < heat.length; i++) {
        const v = Math.min(1, heat[i]);
        const c = palette[(v * 255) | 0];
        const o = i * 4;
        data[o] = c[0];
        data[o + 1] = c[1];
        data[o + 2] = c[2];
        data[o + 3] = c[3];
      }
      fireCtx.putImageData(imgData, 0, 0);

      ctx.save();
      if (texReady && texture) {
        const tw = texture.naturalWidth;
        const th = texture.naturalHeight;
        const scale = Math.max(cssW / tw, (cssH * 1.8) / th) * 1.15;
        const dw = tw * scale;
        const dh = th * scale;
        const dx = (cssW - dw) / 2;
        const shift = ((texOffset * 0.35) % dh) - dh * 0.2;
        ctx.globalAlpha = 0.95;
        ctx.drawImage(texture, dx, shift - dh * 0.35, dw, dh);
        ctx.drawImage(texture, dx, shift - dh * 1.2, dw, dh);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "screen";
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(fireBuf, 0, 0, cssW, cssH);
      ctx.restore();

      // Keep fire only inside letter shapes
      const { textX, baseline, styles } = fillTextClip(cssW, cssH);
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = "#fff";
      ctx.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
      ctx.textBaseline = "alphabetic";
      ctx.fillText("D'or", textX, baseline);
      ctx.globalCompositeOperation = "source-over";

      ctx.save();
      ctx.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
      ctx.textBaseline = "alphabetic";
      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(1.1, parseFloat(styles.fontSize) * 0.016);
      ctx.strokeStyle = "rgba(255, 200, 110, 0.45)";
      ctx.strokeText("D'or", textX, baseline);
      ctx.shadowColor = "rgba(255, 70, 0, 0.55)";
      ctx.shadowBlur = parseFloat(styles.fontSize) * 0.12;
      ctx.fillStyle = "rgba(255, 120, 20, 0.08)";
      ctx.fillText("D'or", textX, baseline);
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(ghost);

    if (reduced) {
      paintStatic();
    } else {
      raf = requestAnimationFrame(draw);
    }

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
        Sushi{" "}
      </span>
      <span className="dor-fire" aria-hidden="true">
        <canvas ref={canvasRef} className="dor-fire__canvas" />
        <span ref={ghostRef} className="dor-fire__ghost">
          D&apos;or
        </span>
      </span>
    </h1>
  );
}

function buildPalette(): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;
    if (t < 0.08) {
      a = 0;
    } else if (t < 0.25) {
      const u = (t - 0.08) / 0.17;
      r = 40 + u * 140;
      g = u * 20;
      b = 0;
      a = Math.floor(40 + u * 160);
    } else if (t < 0.5) {
      const u = (t - 0.25) / 0.25;
      r = 180 + u * 75;
      g = 20 + u * 90;
      b = 0;
      a = 220;
    } else if (t < 0.75) {
      const u = (t - 0.5) / 0.25;
      r = 255;
      g = 110 + u * 100;
      b = u * 40;
      a = 245;
    } else {
      const u = (t - 0.75) / 0.25;
      r = 255;
      g = 210 + u * 45;
      b = 80 + u * 140;
      a = 255;
    }
    out.push([r | 0, g | 0, b | 0, a | 0]);
  }
  return out;
}
