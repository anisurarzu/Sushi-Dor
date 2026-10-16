"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import type { BulkDeleteResource } from "@/lib/soft-delete";

type Options = {
  resource: BulkDeleteResource;
  ids: string[];
  label?: string;
};

export function useBulkDelete({ resource, ids, label = "éléments" }: Options) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const allSelected = ids.length > 0 && selected.size === ids.length;
  const selectedIds = useMemo(() => [...selected], [selected]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
  }, [ids]);

  const run = useCallback(
    (mode: "soft" | "hard") => {
      if (selectedIds.length === 0) return;
      const verb =
        mode === "soft"
          ? `Masquer ${selectedIds.length} ${label} (soft delete) ?`
          : `Supprimer définitivement ${selectedIds.length} ${label} ? Cette action est irréversible.`;
      if (!window.confirm(verb)) return;

      setMsg(null);
      startTransition(async () => {
        try {
          const res = await fetch("/api/admin/bulk-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ resource, mode, ids: selectedIds }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setMsg(data.error || "Échec");
            return;
          }
          setSelected(new Set());
          setMsg(
            mode === "soft"
              ? `${data.count ?? selectedIds.length} masqué(s)`
              : `${data.count ?? selectedIds.length} supprimé(s)`,
          );
          router.refresh();
        } catch {
          setMsg("Erreur réseau");
        }
      });
    },
    [label, resource, router, selectedIds],
  );

  return {
    selected,
    toggle,
    toggleAll,
    allSelected,
    selectedCount: selected.size,
    pending,
    msg,
    run,
  };
}

export function BulkDeleteToolbar({
  allSelected,
  toggleAll,
  selectedCount,
  pending,
  msg,
  onSoft,
  onHard,
  idsCount,
}: {
  allSelected: boolean;
  toggleAll: () => void;
  selectedCount: number;
  pending: boolean;
  msg: string | null;
  onSoft: () => void;
  onHard: () => void;
  idsCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border border-[#c4a35a]/25 bg-[#12100e] px-3 py-2 text-sm">
      <label className="flex items-center gap-2 text-[#c4bbaa]">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          disabled={idsCount === 0 || pending}
        />
        Tout sélectionner
      </label>
      <span className="text-xs text-[#a89f8e]">
        {selectedCount} sélectionné(s)
      </span>
      <button
        type="button"
        disabled={selectedCount === 0 || pending}
        onClick={onSoft}
        className="border border-[#c4a35a]/40 px-2.5 py-1 text-xs text-[#e0c878] disabled:opacity-40"
        title="Masquer de l'interface (conservé en base, status 255)"
      >
        Soft delete
      </button>
      <button
        type="button"
        disabled={selectedCount === 0 || pending}
        onClick={onHard}
        className="border border-red-400/50 px-2.5 py-1 text-xs text-red-300 disabled:opacity-40"
        title="Supprimer définitivement de la base"
      >
        Hard delete
      </button>
      {msg ? <span className="text-xs text-[#a89f8e]">{msg}</span> : null}
    </div>
  );
}

export function RowCheckbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      aria-label="Sélectionner"
      className="cursor-pointer"
    />
  );
}

/** Per-row soft / hard actions */
export function RowDeleteButtons({
  id,
  resource,
  label,
}: {
  id: string;
  resource: BulkDeleteResource;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(mode: "soft" | "hard") {
    const verb =
      mode === "soft"
        ? `Soft delete ${label || "cet élément"} ?`
        : `Hard delete ${label || "cet élément"} ? Irréversible.`;
    if (!window.confirm(verb)) return;
    startTransition(async () => {
      const res = await fetch("/api/admin/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resource, mode, ids: [id] }),
      });
      if (res.ok) router.refresh();
      else {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error || "Échec");
      }
    });
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => run("soft")}
        className="text-[0.65rem] uppercase tracking-wide text-[#c4a35a] hover:text-[#e0c878] disabled:opacity-40"
      >
        Soft
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run("hard")}
        className="text-[0.65rem] uppercase tracking-wide text-red-300/90 hover:text-red-200 disabled:opacity-40"
      >
        Hard
      </button>
    </div>
  );
}
