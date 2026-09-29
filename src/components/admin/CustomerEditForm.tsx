"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userId?: string | null;
};

export function CustomerEditForm({
  email,
  firstName,
  lastName,
  phone,
  userId,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fn, setFn] = useState(firstName);
  const [ln, setLn] = useState(lastName);
  const [ph, setPh] = useState(phone);
  const [em, setEm] = useState(email);

  if (!userId) {
    return (
      <p className="text-sm text-[#a89f8e]">
        Client invité (sans compte). Les données sont portées par les
        commandes — utilisez l&apos;éditeur de commande pour corriger.
      </p>
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    const res = await fetch(`/api/admin/customers/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: fn,
        lastName: ln,
        phone: ph || null,
        email: em,
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setSuccess("Client mis à jour.");
    router.refresh();
  }

  return (
    <form
      onSubmit={save}
      className="space-y-3 border border-[#c4a35a]/20 bg-[#12100e] p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Prénom
          <input
            value={fn}
            onChange={(e) => setFn(e.target.value)}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Nom
          <input
            value={ln}
            onChange={(e) => setLn(e.target.value)}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Téléphone
          <input
            value={ph}
            onChange={(e) => setPh(e.target.value)}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Email
          <input
            value={em}
            onChange={(e) => setEm(e.target.value)}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
      <button type="submit" disabled={pending} className="btn-gold">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
