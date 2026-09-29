"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminSelect } from "@/components/admin/AdminSelect";

export function UserCreateForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STAFF" | "MANAGER" | "SUPER_ADMIN">(
    "STAFF",
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone: phone || null,
        password,
        role,
        isActive: true,
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    router.push(`/admin/users/${data.user.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-xl space-y-4 border border-[#c4a35a]/20 bg-[#12100e] p-4 sm:p-6"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Prénom *
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Nom *
          <input
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
      </div>
      <label className="block text-sm">
        Email *
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Téléphone
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Mot de passe * (min. 8 caractères)
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
        />
      </label>
      <div className="block text-sm">
        <span className="mb-1 block">Rôle</span>
        <AdminSelect
          aria-label="Rôle"
          value={role}
          onChange={(v) => setRole(v as "STAFF" | "MANAGER" | "SUPER_ADMIN")}
          options={[
            { value: "STAFF", label: "STAFF" },
            { value: "MANAGER", label: "MANAGER" },
            { value: "SUPER_ADMIN", label: "SUPER_ADMIN" },
          ]}
        />
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-gold">
          {pending ? "Enregistrement…" : "Créer"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/users")}
          className="border border-[#c4a35a]/30 px-4 py-2 text-sm"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
