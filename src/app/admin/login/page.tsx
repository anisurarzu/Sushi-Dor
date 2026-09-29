"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/admin/orders/latest", { credentials: "include" }).then((res) => {
      if (res.ok) router.replace("/admin");
    });
  }, [router]);

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
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0908] px-4 text-[#f7f2e8]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md border border-[#c4a35a]/25 bg-[#12100e] p-6"
      >
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#c4a35a]">
          Back-office
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[#e0c878]">
          Sushi D&apos;or
        </h1>
        <input
          name="email"
          type="email"
          required
          placeholder="E-mail"
          defaultValue="admin@sushidor.fr"
          className="mt-6 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[#c4a35a]"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Mot de passe"
          className="mt-3 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[#c4a35a]"
        />
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        <button type="submit" disabled={pending} className="btn-gold mt-6 w-full">
          {pending ? "…" : "Connexion"}
        </button>
      </form>
    </main>
  );
}
