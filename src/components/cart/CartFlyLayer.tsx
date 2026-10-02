"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

type Fly = { id: number; x: number; y: number; tx: number; ty: number };

export function CartFlyLayer() {
  const [flies, setFlies] = useState<Fly[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    function onFly(e: Event) {
      const detail = (e as CustomEvent<{ x: number; y: number }>).detail;
      if (!detail) return;
      const cartEl = document.querySelector("[data-cart-badge]");
      const cartRect = cartEl?.getBoundingClientRect();
      const tx = cartRect
        ? cartRect.left + cartRect.width / 2
        : window.innerWidth - 80;
      const ty = cartRect ? cartRect.top + cartRect.height / 2 : 40;
      const id = Date.now() + Math.random();
      setFlies((prev) => [
        ...prev,
        { id, x: detail.x, y: detail.y, tx, ty },
      ]);
      window.setTimeout(() => {
        setFlies((prev) => prev.filter((f) => f.id !== id));
        cartEl?.classList.add("cart-badge-pulse");
        window.setTimeout(
          () => cartEl?.classList.remove("cart-badge-pulse"),
          600,
        );
      }, 700);
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
          className="cart-fly-dot"
          style={
            {
              left: f.x,
              top: f.y,
              "--fly-x": `${f.tx - f.x}px`,
              "--fly-y": `${f.ty - f.y}px`,
            } as CSSProperties
          }
          aria-hidden
        />
      ))}
    </>,
    document.body,
  );
}
