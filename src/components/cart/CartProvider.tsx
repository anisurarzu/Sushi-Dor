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

function euro(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function withRecomputedTotals(
  cart: CartDto,
  items: CartDto["items"],
): CartDto {
  const productsSubtotalCents = items.reduce(
    (s, i) => s + i.basePriceCents * i.quantity,
    0,
  );
  const addonsSubtotalCents = items.reduce(
    (s, i) =>
      s + i.addons.reduce((as, a) => as + a.priceCents, 0) * i.quantity,
    0,
  );
  const subtotalCents = items.reduce((s, i) => s + i.lineTotalCents, 0);
  const deliveryFeeCents =
    cart.orderType === "DELIVERY"
      ? (cart.restaurant?.deliveryFeeCents ?? 0)
      : 0;
  const totalCents = subtotalCents + deliveryFeeCents;

  return {
    ...cart,
    items,
    counts: {
      lines: items.length,
      units: items.reduce((s, i) => s + i.quantity, 0),
    },
    totals: {
      ...cart.totals,
      productsSubtotalCents,
      addonsSubtotalCents,
      subtotalCents,
      deliveryFeeCents,
      totalCents,
      formatted: {
        productsSubtotal: euro(productsSubtotalCents),
        addonsSubtotal: euro(addonsSubtotalCents),
        subtotal: euro(subtotalCents),
        delivery: euro(deliveryFeeCents),
        total: euro(totalCents),
      },
    },
  };
}

function applyOptimisticQty(
  cart: CartDto,
  cartItemId: string,
  quantity: number,
): CartDto {
  const items = cart.items.map((item) => {
    if (item.id !== cartItemId) return item;
    return {
      ...item,
      quantity,
      lineTotalCents: item.unitPriceCents * quantity,
    };
  });
  return withRecomputedTotals(cart, items);
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: "Réponse serveur invalide." };
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartDto | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { credentials: "include" });
      const data = await readJson(res);
      if (!res.ok) return;
      if (data.cart) setCart(data.cart as CartDto);
    } catch {
      // keep previous cart
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await refresh();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  const addItem = useCallback(
    async (input: {
      productId: string;
      quantity: number;
      addonIds: string[];
      cartItemId?: string;
    }) => {
      try {
        const res = await fetch("/api/cart/items", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await readJson(res);
        if (!res.ok) {
          return {
            ok: false as const,
            error: String(data.error || "Impossible d'ajouter au panier."),
          };
        }
        if (data.cart) setCart(data.cart as CartDto);
        return { ok: true as const };
      } catch {
        return {
          ok: false as const,
          error: "Connexion interrompue. Réessayez.",
        };
      }
    },
    [],
  );

  const updateQty = useCallback(
    async (cartItemId: string, quantity: number) => {
      let previous: CartDto | null = null;
      setCart((current) => {
        previous = current;
        if (!current) return current;
        return applyOptimisticQty(current, cartItemId, quantity);
      });

      try {
        const res = await fetch(`/api/cart/items/${cartItemId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        });
        const data = await readJson(res);
        if (!res.ok) {
          if (previous) setCart(previous);
          return {
            ok: false as const,
            error: String(data.error || "Mise à jour impossible."),
          };
        }
        if (data.cart) setCart(data.cart as CartDto);
        return { ok: true as const };
      } catch {
        if (previous) setCart(previous);
        return {
          ok: false as const,
          error: "Connexion interrompue. Réessayez.",
        };
      }
    },
    [],
  );

  const removeItem = useCallback(async (cartItemId: string) => {
    let previous: CartDto | null = null;
    setCart((current) => {
      previous = current;
      if (!current) return current;
      return withRecomputedTotals(
        current,
        current.items.filter((i) => i.id !== cartItemId),
      );
    });

    try {
      const res = await fetch(`/api/cart/items/${cartItemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await readJson(res);
      if (!res.ok) {
        if (previous) setCart(previous);
        return {
          ok: false as const,
          error: String(data.error || "Suppression impossible."),
        };
      }
      if (data.cart) setCart(data.cart as CartDto);
      return { ok: true as const };
    } catch {
      if (previous) setCart(previous);
      return {
        ok: false as const,
        error: "Connexion interrompue. Réessayez.",
      };
    }
  }, []);

  const setOrderType = useCallback(async (orderType: CartDto["orderType"]) => {
    try {
      const res = await fetch("/api/cart/order-type", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderType }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        return {
          ok: false as const,
          error: String(data.error || "Type de commande impossible."),
        };
      }
      if (data.cart) setCart(data.cart as CartDto);
      return { ok: true as const };
    } catch {
      return {
        ok: false as const,
        error: "Connexion interrompue. Réessayez.",
      };
    }
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
