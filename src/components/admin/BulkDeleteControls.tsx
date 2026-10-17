"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import type { BulkDeleteResource } from "@/lib/soft-delete";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { ListSkeleton } from "@/components/ui/ListSkeleton";

type Options = {
  resource: BulkDeleteResource;
  ids: string[];
  label?: string;
};

export function useBulkDelete({ resource, ids, label = "éléments" }: Options) {
  const router = useRouter();
  const confirm = useConfirm();
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
    async (mode: "soft" | "hard") => {
      if (selectedIds.length === 0) return;
      const n = selectedIds.length;
      const ok = await confirm(
        mode === "soft"
          ? {
              title: `Masquer ${n} ${label} ?`,
              description:
                "Soft delete : masqué dans l’interface, conservé en base (status 255).",
              confirmLabel: "Soft delete",
              tone: "warn",
            }
          : {
              title: `Supprimer définitivement ${n} ${label} ?`,
              description:
                "Hard delete : suppression définitive de la base. Action irréversible.",
              confirmLabel: "Hard delete",
              tone: "danger",
            },
      );
      if (!ok) return;

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
    [confirm, label, resource, router, selectedIds],
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
      {pending ? (
        <span className="text-xs text-[#c4a35a]">Actualisation…</span>
      ) : null}
      {msg && !pending ? (
        <span className="text-xs text-[#a89f8e]">{msg}</span>
      ) : null}
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
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();

  async function run(mode: "soft" | "hard") {
    const name = label || "cet élément";
    const ok = await confirm(
      mode === "soft"
        ? {
            title: `Masquer ${name} ?`,
            description:
              "Soft delete : masqué dans l’interface, conservé en base (status 255).",
            confirmLabel: "Soft delete",
            tone: "warn",
          }
        : {
            title: `Supprimer ${name} ?`,
            description:
              "Hard delete : suppression définitive. Action irréversible.",
            confirmLabel: "Hard delete",
            tone: "danger",
          },
    );
    if (!ok) return;
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
        await confirm({
          title: "Échec",
          description: data.error || "La suppression a échoué.",
          confirmLabel: "OK",
          cancelLabel: "Fermer",
          tone: "danger",
        });
      }
    });
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => void run("soft")}
        className="text-[0.65rem] uppercase tracking-wide text-[#c4a35a] hover:text-[#e0c878] disabled:opacity-40"
      >
        Soft
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => void run("hard")}
        className="text-[0.65rem] uppercase tracking-wide text-red-300/90 hover:text-red-200 disabled:opacity-40"
      >
        Hard
      </button>
    </div>
  );
}

/** Wrap list body — shows skeleton while refresh is pending */
export function DeleteListShell({
  pending,
  children,
  skeletonCols = 6,
}: {
  pending: boolean;
  children: React.ReactNode;
  skeletonCols?: number;
}) {
  if (pending) return <ListSkeleton cols={skeletonCols} rows={7} />;
  return <>{children}</>;
}
