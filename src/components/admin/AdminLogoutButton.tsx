"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  className?: string;
  variant?: "link" | "button";
};

export function AdminLogoutButton({
  className = "",
  variant = "button",
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    if (pending) return;
    setPending(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (variant === "link") {
    return (
      <button
        type="button"
        onClick={() => void logout()}
        disabled={pending}
        className={`text-[#c4a35a] hover:text-[#e0c878] disabled:opacity-50 ${className}`}
      >
        {pending ? "…" : "Déconnexion"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={pending}
      className={`border border-[#c4a35a]/40 px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.14em] text-[#e0c878] transition-colors hover:bg-[#c4a35a]/10 disabled:opacity-50 ${className}`}
    >
      {pending ? "…" : "Déconnexion"}
    </button>
  );
}
