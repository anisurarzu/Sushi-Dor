"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    fetch("/api/admin/orders/latest", { credentials: "include" }).then((res) => {
      if (res.ok) router.replace("/admin");
    });
    return () => cancelAnimationFrame(t);
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
    <main className="admin-login-page relative flex min-h-screen items-center justify-center overflow-hidden px-4 text-[#f7f2e8]">
      <div className="admin-login-glow admin-login-glow-a" aria-hidden />
      <div className="admin-login-glow admin-login-glow-b" aria-hidden />
      <div className="admin-login-grain" aria-hidden />

      <div
        className={`relative z-10 w-full max-w-md transition-all duration-700 ease-out ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="mb-8 text-center">
          <p
            className={`text-[0.65rem] uppercase tracking-[0.28em] text-[#c4a35a] transition-all delay-100 duration-700 ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            Back-office
          </p>
          <h1
            className={`mt-3 font-[family-name:var(--font-display)] text-4xl text-[#e0c878] transition-all delay-200 duration-700 sm:text-5xl ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            Sushi D&apos;or
          </h1>
          <p
            className={`mt-3 text-sm text-[#a89f8e] transition-all delay-300 duration-700 ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            Accès sécurisé à la gestion du restaurant
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className={`admin-login-card space-y-4 border border-[#c4a35a]/25 bg-[#12100e]/90 p-6 backdrop-blur-md transition-all delay-150 duration-700 sm:p-8 ${
            mounted ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.98] opacity-0"
          }`}
        >
          <div className="gold-rule" />

          <label className="block text-sm text-[#c4bbaa]">
            E-mail
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="admin@sushidor.fr"
              defaultValue="admin@sushidor.fr"
              className="mt-2 w-full border border-[#c4a35a]/25 bg-[#0a0908]/80 px-3 py-3 text-sm text-[#f0e6c8] outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-[#a89f8e]/50 focus:border-[#c4a35a] focus:shadow-[0_0_0_3px_rgba(196,163,90,0.12)]"
            />
          </label>

          <label className="block text-sm text-[#c4bbaa]">
            Mot de passe
            <div className="relative mt-2">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border border-[#c4a35a]/25 bg-[#0a0908]/80 px-3 py-3 pr-20 text-sm text-[#f0e6c8] outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-[#a89f8e]/50 focus:border-[#c4a35a] focus:shadow-[0_0_0_3px_rgba(196,163,90,0.12)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[0.65rem] uppercase tracking-wider text-[#c4a35a] hover:text-[#e0c878]"
              >
                {showPassword ? "Cacher" : "Voir"}
              </button>
            </div>
          </label>

          {error ? (
            <p
              className="animate-[adminLoginShake_0.4s_ease-in-out] border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="btn-gold group relative mt-2 w-full overflow-hidden py-3 disabled:opacity-70"
          >
            <span
              className={`inline-flex items-center justify-center gap-2 transition-opacity ${
                pending ? "opacity-0" : "opacity-100"
              }`}
            >
              Connexion
            </span>
            {pending ? (
              <span className="absolute inset-0 flex items-center justify-center gap-2">
                <span className="admin-login-spinner" aria-hidden />
                Connexion…
              </span>
            ) : null}
          </button>

          <p className="pt-1 text-center text-[0.7rem] text-[#a89f8e]/80">
            Réservé au personnel autorisé
          </p>
        </form>
      </div>
    </main>
  );
}
