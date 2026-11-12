"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

type Fly = {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  imageUrl?: string | null;
};

const FLY_MS = 1150;

export function CartFlyLayer() {
  const [flies, setFlies] = useState<Fly[]>([]);
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

      window.setTimeout(() => {
        setFlies((prev) => prev.filter((f) => f.id !== id));
        window.dispatchEvent(new CustomEvent("sd:cart-dock-pulse"));
        cartEl?.classList.add("cart-badge-pulse");
        window.setTimeout(
          () => cartEl?.classList.remove("cart-badge-pulse"),
          700,
        );
      }, FLY_MS);
    }
    window.addEventListener("sd:cart-fly", onFly);
    return () => window.removeEventListener("sd:cart-fly", onFly);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <>
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
