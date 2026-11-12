"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

type Spark = {
  id: number;
  x: number;
  y: number;
  kind: "origin" | "arrive";
  angle: number;
  dist: number;
  delay: number;
  size: number;
};

type Fly = {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  imageUrl?: string | null;
};

type Trail = {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  delay: number;
};

const FLY_MS = 1400;
const ORIGIN_SPARKS = 14;
const ARRIVE_SPARKS = 18;
const TRAILS = 5;

function makeSparks(
  baseId: number,
  x: number,
  y: number,
  kind: "origin" | "arrive",
  count: number,
): Spark[] {
  return Array.from({ length: count }, (_, i) => ({
    id: baseId + i + (kind === "arrive" ? 1000 : 0),
    x,
    y,
    kind,
    angle: (360 / count) * i + (kind === "arrive" ? 12 : 0),
    dist: kind === "origin" ? 28 + (i % 4) * 10 : 22 + (i % 5) * 12,
    delay: kind === "origin" ? i * 0.028 : i * 0.018,
    size: kind === "origin" ? 3 + (i % 3) : 2.5 + (i % 4) * 0.8,
  }));
}

export function CartFlyLayer() {
  const [flies, setFlies] = useState<Fly[]>([]);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    function onFly(e: Event) {
      const detail = (
        e as CustomEvent<{ x: number; y: number; imageUrl?: string | null }>
      ).detail;
      if (!detail) return;

      const cartEl =
        document.querySelector("[data-cart-dock]") ||
        document.querySelector("[data-cart-badge]");
      const cartRect = cartEl?.getBoundingClientRect();
      const tx = cartRect
        ? cartRect.left + cartRect.width / 2
        : window.innerWidth - 36;
      const ty = cartRect
        ? cartRect.top + cartRect.height / 2
        : window.innerHeight / 2;
      const id = Date.now() + Math.random();
      const sparkBase = Math.floor(id);

      setFlies((prev) => [
        ...prev,
        {
          id,
          x: detail.x,
          y: detail.y,
          tx,
          ty,
          imageUrl: detail.imageUrl,
        },
      ]);

      setTrails((prev) => [
        ...prev,
        ...Array.from({ length: TRAILS }, (_, i) => ({
          id: sparkBase + 5000 + i,
          x: detail.x,
          y: detail.y,
          tx,
          ty,
          delay: 0.08 + i * 0.09,
        })),
      ]);

      setSparks((prev) => [
        ...prev,
        ...makeSparks(sparkBase, detail.x, detail.y, "origin", ORIGIN_SPARKS),
      ]);

      window.setTimeout(() => {
        setSparks((prev) => [
          ...prev.filter((s) => s.id < sparkBase || s.id >= sparkBase + 1000),
          ...makeSparks(sparkBase, tx, ty, "arrive", ARRIVE_SPARKS),
        ]);
        window.dispatchEvent(new CustomEvent("sd:cart-dock-pulse"));
        cartEl?.classList.add("cart-badge-pulse");
        window.setTimeout(
          () => cartEl?.classList.remove("cart-badge-pulse"),
          800,
        );
      }, FLY_MS - 80);

      window.setTimeout(() => {
        setFlies((prev) => prev.filter((f) => f.id !== id));
        setTrails((prev) =>
          prev.filter((t) => t.id < sparkBase + 5000 || t.id >= sparkBase + 5000 + TRAILS),
        );
        setSparks((prev) =>
          prev.filter(
            (s) => s.id < sparkBase || s.id >= sparkBase + 1000 + ARRIVE_SPARKS,
          ),
        );
      }, FLY_MS + 700);
    }
    window.addEventListener("sd:cart-fly", onFly);
    return () => window.removeEventListener("sd:cart-fly", onFly);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <>
      {sparks.map((s) => (
        <span
          key={s.id}
          className={`cart-spark cart-spark--${s.kind}`}
          style={
            {
              left: s.x,
              top: s.y,
              width: s.size,
              height: s.size,
              "--spark-angle": `${s.angle}deg`,
              "--spark-dist": `${s.dist}px`,
              "--spark-delay": `${s.delay}s`,
            } as CSSProperties
          }
          aria-hidden
        />
      ))}

      {trails.map((t) => (
        <span
          key={t.id}
          className="cart-fly-trail"
          style={
            {
              left: t.x,
              top: t.y,
              "--fly-x": `${t.tx - t.x}px`,
              "--fly-y": `${t.ty - t.y}px`,
              "--trail-delay": `${t.delay}s`,
            } as CSSProperties
          }
          aria-hidden
        />
      ))}

      {flies.map((f) => (
        <span
          key={f.id}
          className={`cart-fly-dot ${f.imageUrl ? "cart-fly-dot--image" : ""}`}
          style={
            {
              left: f.x,
              top: f.y,
              "--fly-x": `${f.tx - f.x}px`,
              "--fly-y": `${f.ty - f.y}px`,
              ...(f.imageUrl
                ? { backgroundImage: `url(${f.imageUrl})` }
                : null),
            } as CSSProperties
          }
          aria-hidden
        />
      ))}
    </>,
    document.body,
  );
}
