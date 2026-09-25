"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartDto = {
  id: string;
  orderType: "TAKEAWAY" | "DELIVERY" | "DINE_IN";
  restaurant: {
    id: string;
    name: string;
    city: string;
    deliveryFeeCents: number;
    deliveryEnabled: boolean;
    pickupEnabled: boolean;
  } | null;
  items: {
    id: string;
    productId: string;
    slug: string;
    nameFr: string;
    imageUrl: string | null;
    quantity: number;
    basePriceCents: number;
    unitPriceCents: number;
    lineTotalCents: number;
    addons: { id: string; addonId: string; nameFr: string; priceCents: number }[];
  }[];
  counts: { lines: number; units: number };
  totals: {
    productsSubtotalCents: number;
    addonsSubtotalCents: number;
    subtotalCents: number;
    deliveryFeeCents: number;
    discountCents: number;
    totalCents: number;
    formatted: {
      productsSubtotal: string;
      addonsSubtotal: string;
      subtotal: string;
      delivery: string;
      total: string;
    };
  };
};

type CartContextValue = {
  cart: CartDto | null;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (input: {
    productId: string;
    quantity: number;
    addonIds: string[];
    cartItemId?: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  updateQty: (
    cartItemId: string,
    quantity: number,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  removeItem: (
    cartItemId: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  setOrderType: (
    orderType: CartDto["orderType"],
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartDto | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/cart", { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    setCart(data.cart);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const addItem = useCallback(
    async (input: {
      productId: string;
      quantity: number;
      addonIds: string[];
      cartItemId?: string;
    }) => {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false as const, error: data.error || "Erreur" };
      setCart(data.cart);
      return { ok: true as const };
    },
    [],
  );

  const updateQty = useCallback(async (cartItemId: string, quantity: number) => {
    const res = await fetch(`/api/cart/items/${cartItemId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false as const, error: data.error || "Erreur" };
    setCart(data.cart);
    return { ok: true as const };
  }, []);

  const removeItem = useCallback(async (cartItemId: string) => {
    const res = await fetch(`/api/cart/items/${cartItemId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) return { ok: false as const, error: data.error || "Erreur" };
    setCart(data.cart);
    return { ok: true as const };
  }, []);

  const setOrderType = useCallback(async (orderType: CartDto["orderType"]) => {
    const res = await fetch("/api/cart/order-type", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderType }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false as const, error: data.error || "Erreur" };
    setCart(data.cart);
    return { ok: true as const };
  }, []);

  const value = useMemo(
    () => ({
      cart,
      loading,
      refresh,
      addItem,
      updateQty,
      removeItem,
      setOrderType,
    }),
    [cart, loading, refresh, addItem, updateQty, removeItem, setOrderType],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
