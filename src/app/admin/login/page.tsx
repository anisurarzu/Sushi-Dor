"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Connexion impossible");
      return;
    }
    router.push("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 text-bone">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md border border-[color:var(--line)] p-6"
      >
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Admin Sushi D&apos;or
        </h1>
        <input
          name="email"
          type="email"
          required
          placeholder="E-mail"
          defaultValue="admin@sushidor.fr"
          className="mt-6 w-full border border-[color:var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Mot de passe"
          className="mt-3 w-full border border-[color:var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        <button type="submit" disabled={pending} className="btn-gold mt-6 w-full">
          {pending ? "…" : "Connexion"}
        </button>
      </form>
    </main>
  );
}
