"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    role: string;
  };
};

export function ProfileForm({ user }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [password, setPassword] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    const res = await fetch("/api/admin/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        phone: phone || null,
        password: password || undefined,
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setPassword("");
    setSuccess("Profil mis à jour.");
    router.refresh();
  }

  return (
    <form
      onSubmit={save}
      className="max-w-xl space-y-4 border border-[#c4a35a]/20 bg-[#12100e] p-4 sm:p-6"
    >
      <p className="text-sm text-[#a89f8e]">
        Rôle: <span className="text-[#e0c878]">{user.role}</span>
      </p>
      <p className="text-sm text-[#c4bbaa]">{user.email}</p>
      <label className="block text-sm">
        Prénom
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Nom
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
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
        Nouveau mot de passe
        <input
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Laisser vide pour ne pas changer"
          className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
        />
      </label>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
      <button type="submit" disabled={pending} className="btn-gold">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
