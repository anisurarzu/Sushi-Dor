"use client";

import { useState } from "react";

type RoleRow = {
  id: string;
  key: string;
  nameFr: string;
  permissions: { permission: string }[];
};

type Props = {
  initialRoles: RoleRow[];
  allPermissions: string[];
};

export function RolePermissionsEditor({
  initialRoles,
  allPermissions,
}: Props) {
  const [roles, setRoles] = useState(initialRoles);
  const [selected, setSelected] = useState(
    initialRoles.find((r) => r.key === "MANAGER")?.key ||
      initialRoles[0]?.key ||
      "MANAGER",
  );
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const role =
      initialRoles.find((r) => r.key === "MANAGER") || initialRoles[0];
    const map: Record<string, boolean> = {};
    for (const p of role?.permissions || []) map[p.permission] = true;
    return map;
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function selectRole(key: string) {
    setSelected(key);
    const role = roles.find((r) => r.key === key);
    const map: Record<string, boolean> = {};
    for (const p of role?.permissions || []) map[p.permission] = true;
    setChecked(map);
    setMessage(null);
  }

  async function save() {
    if (selected === "SUPER_ADMIN") {
      setError("SUPER_ADMIN a toutes les permissions.");
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    const permissions = Object.entries(checked)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const res = await fetch("/api/admin/roles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleKey: selected, permissions }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setMessage("Permissions enregistrées.");
    setRoles((prev) =>
      prev.map((r) =>
        r.key === selected
          ? {
              ...r,
              permissions: permissions.map((permission) => ({ permission })),
            }
          : r,
      ),
    );
  }

  const groups = allPermissions.reduce<Record<string, string[]>>((acc, p) => {
    const [mod] = p.split(".");
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {roles.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => selectRole(r.key)}
            className={`border px-3 py-1.5 text-sm ${
              selected === r.key
                ? "border-[#c4a35a] bg-[#c4a35a]/15 text-[#e0c878]"
                : "border-[#c4a35a]/25 text-[#c4bbaa]"
            }`}
          >
            {r.nameFr}
          </button>
        ))}
      </div>

      <div className="border border-[#c4a35a]/20 bg-[#12100e] p-4">
        <p className="text-sm text-[#a89f8e]">
          Rôle: <span className="text-[#e0c878]">{selected}</span>
          {selected === "SUPER_ADMIN"
            ? " — toutes les permissions (non modifiable)"
            : ""}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(groups).map(([mod, perms]) => (
            <div key={mod}>
              <p className="text-[0.65rem] uppercase tracking-wider text-[#c4a35a]">
                {mod}
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {perms.map((p) => (
                  <li key={p}>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={selected === "SUPER_ADMIN"}
                        checked={
                          selected === "SUPER_ADMIN"
                            ? true
                            : Boolean(checked[p])
                        }
                        onChange={(e) =>
                          setChecked((prev) => ({
                            ...prev,
                            [p]: e.target.checked,
                          }))
                        }
                      />
                      {p.split(".")[1]}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        {message ? (
          <p className="mt-3 text-sm text-emerald-300">{message}</p>
        ) : null}
        <button
          type="button"
          disabled={pending || selected === "SUPER_ADMIN"}
          onClick={() => void save()}
          className="btn-gold mt-4"
        >
          {pending ? "Enregistrement…" : "Enregistrer les permissions"}
        </button>
      </div>
    </div>
  );
}
