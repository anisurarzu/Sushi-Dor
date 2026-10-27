"use client";

import { useEffect, useRef } from "react";

/**
 * Hero mark: "Sushi" plain + "D'or" with live fire inside letters,
 * flames rising and licking a little above the glyph tops.
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
    let cssW = 0;
    let cssH = 0;
    let textH = 0;
    let plumeH = 0;
    let textBaseline = 0;
    let textX = 0;
    let fontCss = "";
    let fontPx = 48;

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      texture = img;
      texReady = true;
    };
    img.src = "/brand/fire-fill.jpg";

    const palette = buildPalette();

    const measure = () => {
      const styles = getComputedStyle(ghost);
      fontCss = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
      fontPx = parseFloat(styles.fontSize) || 48;
      ctx.font = fontCss;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      const metrics = ctx.measureText("D'or");
      const ascent =
        metrics.actualBoundingBoxAscent || fontPx * 0.78;
      const descent = metrics.actualBoundingBoxDescent || fontPx * 0.12;
      textH = Math.ceil(ascent + descent);
      plumeH = Math.ceil(fontPx * 0.55);
      cssW = Math.max(2, Math.ceil(Math.max(ghost.offsetWidth, metrics.width)));
      cssH = textH + plumeH;
      textX = (cssW - metrics.width) / 2;
      // baseline sits in the lower text band (below plume)
      textBaseline = plumeH + ascent;
      return metrics.width;
    };

    const resize = () => {
      measure();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      fireW = Math.max(64, Math.floor(cssW / 2.2));
      fireH = Math.max(48, Math.floor(cssH / 2.2));
      heat = new Float32Array(fireW * fireH);
      fireBuf = document.createElement("canvas");
      fireBuf.width = fireW;
      fireBuf.height = fireH;
      fireCtx = fireBuf.getContext("2d");
      imgData = fireCtx ? fireCtx.createImageData(fireW, fireH) : null;
    };

    /** Seed heat under the letter tops so flames climb upward into the plume. */
    const stepFire = () => {
      if (!heat) return;
      const w = fireW;
      const h = fireH;
      // Letter band in fire-buffer coords (below plume)
      const letterTop = Math.floor((plumeH / cssH) * h);
      const letterBot = h - 1;
      const fuelY = Math.min(
        letterBot - 1,
        Math.floor(letterTop + (letterBot - letterTop) * 0.72),
      );

      // Fuel line near upper-middle of glyphs — heat rises to top
      for (let x = 0; x < w; x++) {
        const nx = x / (w - 1);
        // Stronger under D and o peaks
        const shape =
          0.55 +
          0.45 *
            Math.max(
              Math.exp(-Math.pow((nx - 0.18) * 4.2, 2)),
              Math.exp(-Math.pow((nx - 0.48) * 5.5, 2)),
              Math.exp(-Math.pow((nx - 0.78) * 4.8, 2)),
            );
        heat[fuelY * w + x] = Math.max(
          heat[fuelY * w + x],
          (0.75 + Math.random() * 0.25) * shape,
        );
        if (Math.random() > 0.82) {
          heat[Math.max(0, fuelY - 1) * w + x] = 0.55 + Math.random() * 0.45;
        }
        // Extra jets that break above the letter top
        if (Math.random() > 0.93) {
          const jy = Math.max(0, letterTop - 2 - ((Math.random() * 4) | 0));
          heat[jy * w + x] = 0.45 + Math.random() * 0.55;
        }
      }

      // Rise upward (copy from below → above)
      for (let y = 0; y < h - 1; y++) {
        for (let x = 0; x < w; x++) {
          const below =
            heat[(y + 1) * w + x] * 0.32 +
            heat[(y + 1) * w + ((x - 1 + w) % w)] * 0.24 +
            heat[(y + 1) * w + ((x + 1) % w)] * 0.24 +
            (y + 2 < h ? heat[(y + 2) * w + x] * 0.2 : 0);
          // Cool faster high in the plume so tips fade
          const inPlume = y < letterTop;
          const cool = inPlume ? 0.04 + Math.random() * 0.03 : 0.018;
          const wind = (Math.random() - 0.5) * 0.05;
          heat[y * w + x] = Math.max(0, below * (0.97 + wind) - cool);
        }
      }
    };

    const drawLetterMask = (alpha = 1) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = fontCss;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      ctx.fillText("D'or", textX, textBaseline);
      ctx.restore();
    };

    /** Soft upward flame tongues above the glyph tops (outside the letters). */
    const drawPlumeMask = () => {
      ctx.save();
      ctx.font = fontCss;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";

      // Soft silhouette stack above the letters
      for (let i = 0; i < 7; i++) {
        const t = i / 6;
        const lift = plumeH * (0.12 + t * 0.9);
        const squash = 1 - t * 0.55;
        const a = (1 - t) * (1 - t) * 0.55;
        ctx.save();
        ctx.translate(cssW / 2, textBaseline);
        ctx.scale(squash * (0.92 + Math.sin(texOffset * 0.04 + i) * 0.04), 1);
        ctx.translate(-cssW / 2, -textBaseline - lift);
        ctx.globalAlpha = a;
        ctx.fillStyle = "#fff";
        ctx.fillText("D'or", textX, textBaseline);
        ctx.restore();
      }

      // Extra vertical lick blobs along the top edge
      const topY = textBaseline - fontPx * 0.72;
      for (let i = 0; i < 10; i++) {
        const px =
          textX +
          (i / 9) * (cssW - textX * 2) +
          Math.sin(texOffset * 0.07 + i * 1.7) * fontPx * 0.04;
        const ph =
          plumeH *
          (0.35 + 0.55 * Math.abs(Math.sin(texOffset * 0.05 + i * 0.9)));
        const pw = fontPx * (0.08 + (i % 3) * 0.03);
        const g = ctx.createRadialGradient(px, topY, 0, px, topY - ph * 0.4, ph);
        g.addColorStop(0, "rgba(255,255,255,0.85)");
        g.addColorStop(0.45, "rgba(255,255,255,0.35)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(px, topY - ph * 0.35, pw, ph * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const paintFireLayer = () => {
      if (!heat || !fireBuf || !fireCtx || !imgData) return;
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
        const scale = Math.max(cssW / tw, (cssH * 1.6) / th) * 1.2;
        const dw = tw * scale;
        const dh = th * scale;
        const dx = (cssW - dw) / 2;
        // Scroll texture upward (flames climbing)
        const shift = -((texOffset * 0.55) % dh);
        ctx.globalAlpha = 0.9;
        ctx.drawImage(texture, dx, shift + plumeH * 0.2, dw, dh);
        ctx.drawImage(texture, dx, shift + dh * 0.85 + plumeH * 0.2, dw, dh);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "screen";
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(fireBuf, 0, 0, cssW, cssH);
      ctx.restore();
    };

    const paintStatic = () => {
      ctx.clearRect(0, 0, cssW, cssH);
      const grad = ctx.createLinearGradient(0, plumeH, 0, cssH);
      grad.addColorStop(0, "#fff6b0");
      grad.addColorStop(0.4, "#ff8a1a");
      grad.addColorStop(0.75, "#d02000");
      grad.addColorStop(1, "#4a0800");
      ctx.font = fontCss;
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = grad;
      ctx.fillText("D'or", textX, textBaseline);
    };

    const draw = () => {
      if (!running || !heat || !fireBuf || !fireCtx || !imgData) return;
      ctx.clearRect(0, 0, cssW, cssH);

      stepFire();
      texOffset += 1.15;

      paintFireLayer();

      // Clip: letters solid + soft flames only above the top
      ctx.globalCompositeOperation = "destination-in";
      drawLetterMask(1);
      drawPlumeMask();
      ctx.globalCompositeOperation = "source-over";

      // Readable hot rim on glyphs
      ctx.save();
      ctx.font = fontCss;
      ctx.textBaseline = "alphabetic";
      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(1.1, fontPx * 0.015);
      ctx.strokeStyle = "rgba(255, 210, 120, 0.42)";
      ctx.strokeText("D'or", textX, textBaseline);
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
        Sushi{"\u00A0"}
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
