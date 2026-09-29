"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProductDuplicateButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function duplicate() {
    setPending(true);
    const res = await fetch(`/api/admin/products/${productId}/duplicate`, {
      method: "POST",
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      alert(data.error || "Duplication échouée");
      return;
    }
    router.push(`/admin/products/${data.product.id}`);
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void duplicate()}
      className="border border-[#c4a35a]/40 px-3 py-2 text-sm text-[#e0c878]"
    >
      {pending ? "…" : "Dupliquer"}
    </button>
  );
}
