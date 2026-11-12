"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "register";

export function CustomerAuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/compte";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const endpoint =
        mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload =
        mode === "register"
          ? form
          : { email: form.email, password: form.password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        setPending(false);
        return;
      }
      router.replace(next.startsWith("/") ? next : "/compte");
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessayez.");
      setPending(false);
    }
  }

  const inputClass =
    "mt-1 w-full border border-[color:var(--line)] bg-ink-soft/60 px-3 py-2.5 text-bone";

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto max-w-md space-y-4">
      {mode === "register" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Prénom *
            <input
              required
              className={inputClass}
              value={form.firstName}
              onChange={(e) =>
                setForm({ ...form, firstName: e.target.value })
              }
              autoComplete="given-name"
            />
          </label>
          <label className="text-sm">
            Nom *
            <input
              required
              className={inputClass}
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              autoComplete="family-name"
            />
          </label>
        </div>
      ) : null}

      <label className="block text-sm">
        E-mail *
        <input
          required
          type="email"
          className={inputClass}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          autoComplete="email"
        />
      </label>

      {mode === "register" ? (
        <label className="block text-sm">
          Téléphone
          <input
            type="tel"
            className={inputClass}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            autoComplete="tel"
          />
        </label>
      ) : null}

      <label className="block text-sm">
        Mot de passe *{" "}
        <span className="text-mist">(8 caractères min.)</span>
        <input
          required
          type="password"
          minLength={8}
          className={inputClass}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          autoComplete={
            mode === "register" ? "new-password" : "current-password"
          }
        />
      </label>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <button type="submit" className="btn-gold w-full" disabled={pending}>
        {pending
          ? "Patientez…"
          : mode === "register"
            ? "Créer mon compte"
            : "Se connecter"}
      </button>

      <p className="text-center text-sm text-mist">
        {mode === "register" ? (
          <>
            Déjà un compte ?{" "}
            <Link
              href={`/compte/connexion?next=${encodeURIComponent(next)}`}
              className="text-gold underline"
            >
              Se connecter
            </Link>
          </>
        ) : (
          <>
            Pas encore de compte ?{" "}
            <Link
              href={`/compte/inscription?next=${encodeURIComponent(next)}`}
              className="text-gold underline"
            >
              Créer un compte
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
