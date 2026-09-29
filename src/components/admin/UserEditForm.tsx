"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import { AdminSelect } from "@/components/admin/AdminSelect";

type Props = {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    role: string;
    isActive: boolean;
    userPermissions: { permission: string; granted: boolean }[];
  };
  canEditSuper: boolean;
};

export function UserEditForm({ user, canEditSuper }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [password, setPassword] = useState("");
  const [extras, setExtras] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const p of user.userPermissions) {
      if (p.granted) map[p.permission] = true;
    }
    return map;
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    const extraPermissions = Object.entries(extras).map(
      ([permission, granted]) => ({ permission, granted }),
    );
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone: phone || null,
        role,
        isActive,
        password: password || undefined,
        extraPermissions: canEditSuper ? extraPermissions : undefined,
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setPassword("");
    setSuccess("Utilisateur mis à jour.");
    router.refresh();
  }

  return (
    <form
      onSubmit={save}
      className="max-w-2xl space-y-4 border border-[#c4a35a]/20 bg-[#12100e] p-4 sm:p-6"
    >
      <div className="grid gap-3 sm:grid-cols-2">
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
      </div>
      <label className="block text-sm">
        Email
        <input
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
      <div className="block text-sm">
        <span className="mb-1 block">Rôle</span>
        <AdminSelect
          aria-label="Rôle"
          value={role === "ADMIN" ? "SUPER_ADMIN" : role}
          onChange={setRole}
          disabled={!canEditSuper && (role === "SUPER_ADMIN" || role === "ADMIN")}
          options={[
            { value: "STAFF", label: "STAFF" },
            { value: "MANAGER", label: "MANAGER" },
            { value: "SUPER_ADMIN", label: "SUPER_ADMIN" },
          ]}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Compte actif
      </label>
      <label className="block text-sm">
        Réinitialiser le mot de passe
        <input
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Laisser vide pour ne pas changer"
          className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
        />
      </label>

      {canEditSuper ? (
        <fieldset className="border border-[#c4a35a]/15 p-3">
          <legend className="px-1 text-[0.65rem] uppercase tracking-wider text-[#c4a35a]">
            Permissions supplémentaires
          </legend>
          <div className="mt-2 grid max-h-56 gap-1 overflow-y-auto text-xs sm:grid-cols-2">
            {ALL_PERMISSIONS.map((p) => (
              <label key={p} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(extras[p])}
                  onChange={(e) =>
                    setExtras((prev) => ({ ...prev, [p]: e.target.checked }))
                  }
                />
                {p}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
      <button type="submit" disabled={pending} className="btn-gold">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
