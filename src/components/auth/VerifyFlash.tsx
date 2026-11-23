"use client";

import { useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  ok: "E-mail confirmé. Merci !",
  already: "Cet e-mail est déjà confirmé.",
  missing: "Lien de vérification manquant.",
  sent: "Compte créé. Un e-mail de confirmation vous a été envoyé.",
};

export function VerifyFlash() {
  const search = useSearchParams();
  const key = search.get("verify");
  const text = key ? MESSAGES[key] : null;
  if (!text) return null;

  const ok = key === "ok" || key === "already" || key === "sent";
  return (
    <div
      className={`mb-8 border px-4 py-3 text-sm ${
        ok
          ? "border-emerald-700/50 bg-emerald-950/40 text-emerald-100"
          : "border-amber-700/40 bg-amber-950/30 text-amber-50"
      }`}
    >
      {text}
    </div>
  );
}
