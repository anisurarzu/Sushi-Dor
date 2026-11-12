"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CustomerLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void logout()}
      className="header-cta header-cta--ghost"
    >
      {pending ? "…" : "Déconnexion"}
    </button>
  );
}
