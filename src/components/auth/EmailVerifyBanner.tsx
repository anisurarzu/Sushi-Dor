"use client";

import { useState } from "react";

export function EmailVerifyBanner({ email }: { email: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function resend() {
    setPending(true);
    setMessage(null);
    setError(false);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(true);
        setMessage(data.error || "Envoi impossible.");
        setPending(false);
        return;
      }
      setMessage(
        data.skipped
          ? "E-mail non configuré côté serveur — réessayez plus tard."
          : `Un nouveau lien a été envoyé à ${email}.`,
      );
    } catch {
      setError(true);
      setMessage("Erreur réseau. Réessayez.");
    }
    setPending(false);
  }

  return (
    <div className="mb-8 border border-amber-700/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-50">
      <p>
        Confirmez votre e-mail <strong className="text-bone">{email}</strong> pour
        sécuriser votre compte. Vérifiez aussi vos spams.
      </p>
      {message ? (
        <p className={`mt-2 ${error ? "text-red-300" : "text-emerald-200"}`}>
          {message}
        </p>
      ) : null}
      <button
        type="button"
        className="mt-3 text-gold underline disabled:opacity-50"
        disabled={pending}
        onClick={() => void resend()}
      >
        {pending ? "Envoi…" : "Renvoyer le lien"}
      </button>
    </div>
  );
}
