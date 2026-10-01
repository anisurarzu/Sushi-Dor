"use client";

import { useState } from "react";

export function ReprintButton({ orderId }: { orderId: string }) {
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onReprint() {
    setPending(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/reprint`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || "Échec");
      } else {
        setMsg("Ticket envoyé à l'imprimante (file d'attente)");
      }
    } catch {
      setMsg("Erreur réseau");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onReprint}
        disabled={pending}
        className="btn-ghost w-full cursor-pointer text-sm disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Réimprimer le ticket"}
      </button>
      {msg ? <p className="text-xs text-[#c4bbaa]">{msg}</p> : null}
    </div>
  );
}
