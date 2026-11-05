"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSelect } from "@/components/admin/AdminSelect";
import {
  BulkDeleteToolbar,
  DeleteListShell,
  RowCheckbox,
  RowDeleteButtons,
  useBulkDelete,
} from "@/components/admin/BulkDeleteControls";

type Reservation = {
  id: string;
  confirmationCode: string;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  occasion: string | null;
  specialRequest: string | null;
  adminNotes: string | null;
  status: string;
  source: string;
  restaurantId: string;
  restaurantName: string;
};

type Props = {
  initial: Reservation[];
  restaurants: { id: string; name: string }[];
  todayGuestCount: number;
  todayCount: number;
  pendingCount: number;
};

const STATUS_OPTIONS = [
  { value: "PENDING", label: "En attente" },
  { value: "CONFIRMED", label: "Confirmée" },
  { value: "COMPLETED", label: "Terminée / assise" },
  { value: "NO_SHOW", label: "No-show" },
  { value: "CANCELLED", label: "Annulée" },
];

const SOURCE_OPTIONS = [
  { value: "ONLINE", label: "En ligne" },
  { value: "PHONE", label: "Téléphone" },
  { value: "WALK_IN", label: "Sur place" },
  { value: "OTHER", label: "Autre" },
];

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-amber-200",
  CONFIRMED: "text-emerald-300",
  COMPLETED: "text-[#c4a35a]",
  NO_SHOW: "text-orange-300",
  CANCELLED: "text-red-300",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function ReservationManager({
  initial,
  restaurants,
  todayGuestCount,
  todayCount,
  pendingCount,
}: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pending, setPending] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [query, setQuery] = useState("");
  const bulk = useBulkDelete({
    resource: "reservations",
    ids: rows.map((r) => r.id),
    label: "réservation(s)",
  });
  const [form, setForm] = useState({
    restaurantId: restaurants[0]?.id || "",
    date: todayStr(),
    startTime: "19:00",
    partySize: 2,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequest: "",
    occasion: "",
    source: "PHONE",
    status: "CONFIRMED",
    adminNotes: "",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterDate && r.date !== filterDate) return false;
      if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
      if (!q) return true;
      return (
        r.confirmationCode.toLowerCase().includes(q) ||
        r.firstName.toLowerCase().includes(q) ||
        r.lastName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
      );
    });
  }, [rows, filterDate, filterStatus, query]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/admin/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        specialRequest: form.specialRequest || null,
        occasion: form.occasion || null,
        adminNotes: form.adminNotes || null,
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setShowCreate(false);
    router.refresh();
  }

  async function setStatus(id: string, status: string) {
    setError(null);
    const res = await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: data.reservation.status } : r,
      ),
    );
  }

  async function saveRow(r: Reservation) {
    setError(null);
    const res = await fetch(`/api/admin/reservations/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: r.date,
        startTime: r.startTime,
        endTime: r.endTime,
        partySize: r.partySize,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        phone: r.phone,
        specialRequest: r.specialRequest,
        occasion: r.occasion,
        adminNotes: r.adminNotes,
        restaurantId: r.restaurantId,
        source: r.source,
        status: r.status,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    router.refresh();
  }

  function patchRow(id: string, patch: Partial<Reservation>) {
    setRows((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border border-[#c4a35a]/20 bg-[#12100e] p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.16em] text-[#a89f8e]">
            Aujourd&apos;hui
          </p>
          <p className="mt-1 text-2xl text-[#e0c878]">{todayCount}</p>
          <p className="text-xs text-[#a89f8e]">{todayGuestCount} convives</p>
        </div>
        <div className="border border-[#c4a35a]/20 bg-[#12100e] p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.16em] text-[#a89f8e]">
            En attente
          </p>
          <p className="mt-1 text-2xl text-amber-200">{pendingCount}</p>
          <p className="text-xs text-[#a89f8e]">À confirmer</p>
        </div>
        <div className="border border-[#c4a35a]/20 bg-[#12100e] p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.16em] text-[#a89f8e]">
            Liste chargée
          </p>
          <p className="mt-1 text-2xl text-[#e0c878]">{rows.length}</p>
          <p className="text-xs text-[#a89f8e]">À venir + récentes</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-[#a89f8e]">
          Date
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="mt-1 block border border-[#c4a35a]/25 bg-transparent px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-[#a89f8e]">
          Statut
          <div className="mt-1 min-w-[10rem]">
            <AdminSelect
              aria-label="Filtrer statut"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: "ALL", label: "Tous" },
                ...STATUS_OPTIONS,
              ]}
            />
          </div>
        </label>
        <label className="min-w-[12rem] flex-1 text-xs text-[#a89f8e]">
          Recherche
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Code, nom, e-mail, tél…"
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          className="text-xs text-[#c4a35a]"
          onClick={() => {
            setFilterDate(todayStr());
            setFilterStatus("ALL");
          }}
        >
          Aujourd&apos;hui
        </button>
        <button
          type="button"
          className="text-xs text-[#a89f8e]"
          onClick={() => {
            setFilterDate("");
            setFilterStatus("ALL");
            setQuery("");
          }}
        >
          Réinitialiser
        </button>
        <button
          type="button"
          className="btn-gold text-sm"
          onClick={() => setShowCreate((v) => !v)}
        >
          {showCreate ? "Fermer" : "Nouvelle réservation"}
        </button>
      </div>

      {showCreate ? (
        <form
          onSubmit={create}
          className="grid gap-3 border border-[#c4a35a]/20 bg-[#12100e] p-4 sm:grid-cols-2"
        >
          <div className="text-sm">
            <span className="mb-1 block">Restaurant</span>
            <AdminSelect
              aria-label="Restaurant"
              value={form.restaurantId}
              onChange={(v) => setForm({ ...form, restaurantId: v })}
              options={restaurants.map((r) => ({ value: r.id, label: r.name }))}
            />
          </div>
          <div className="text-sm">
            <span className="mb-1 block">Source</span>
            <AdminSelect
              aria-label="Source"
              value={form.source}
              onChange={(v) => setForm({ ...form, source: v })}
              options={SOURCE_OPTIONS}
            />
          </div>
          <label className="text-sm">
            Date
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Heure
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Convives
            <input
              type="number"
              min={1}
              value={form.partySize}
              onChange={(e) =>
                setForm({ ...form, partySize: Number(e.target.value) || 1 })
              }
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <div className="text-sm">
            <span className="mb-1 block">Statut</span>
            <AdminSelect
              aria-label="Statut"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={STATUS_OPTIONS}
            />
          </div>
          <label className="text-sm">
            Prénom
            <input
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Nom
            <input
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Téléphone
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Occasion
            <input
              value={form.occasion}
              onChange={(e) => setForm({ ...form, occasion: e.target.value })}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Demande client
            <input
              value={form.specialRequest}
              onChange={(e) =>
                setForm({ ...form, specialRequest: e.target.value })
              }
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Note interne
            <input
              value={form.adminNotes}
              onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="btn-gold sm:col-span-2"
          >
            {pending ? "Enregistrement…" : "Créer"}
          </button>
        </form>
      ) : null}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {filtered.length === 0 ? (
        <p className="border border-[#c4a35a]/20 p-6 text-sm text-[#a89f8e]">
          Aucune réservation pour ces filtres.
        </p>
      ) : (
        <div className="space-y-3">
          <BulkDeleteToolbar
            allSelected={bulk.allSelected}
            toggleAll={bulk.toggleAll}
            selectedCount={bulk.selectedCount}
            pending={bulk.pending}
            msg={bulk.msg}
            onSoft={() => void bulk.run("soft")}
            onHard={() => void bulk.run("hard")}
            idsCount={filtered.length}
          />
          <DeleteListShell pending={bulk.pending} skeletonCols={4}>
            {filtered.map((r) => (
              <article
                key={r.id}
                className="space-y-2 border border-[#c4a35a]/20 bg-[#12100e] p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <RowCheckbox
                      checked={bulk.selected.has(r.id)}
                      onChange={() => bulk.toggle(r.id)}
                      disabled={bulk.pending}
                    />
                    <div>
                      <p className="text-[#e0c878]">{r.confirmationCode}</p>
                      <p className="text-[0.65rem] uppercase tracking-[0.12em] text-[#a89f8e]">
                        {SOURCE_OPTIONS.find((s) => s.value === r.source)
                          ?.label || r.source}{" "}
                        · {r.restaurantName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={STATUS_COLOR[r.status] || "text-[#c4a35a]"}>
                      {STATUS_OPTIONS.find((s) => s.value === r.status)?.label ||
                        r.status}
                    </span>
                    <RowDeleteButtons
                      id={r.id}
                      resource="reservations"
                      label={r.confirmationCode}
                    />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  <input
                    type="date"
                    value={r.date}
                    onChange={(e) => patchRow(r.id, { date: e.target.value })}
                    className="border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                  />
                  <input
                    type="time"
                    value={r.startTime}
                    onChange={(e) =>
                      patchRow(r.id, { startTime: e.target.value })
                    }
                    className="border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                  />
                  <input
                    type="time"
                    value={r.endTime}
                    onChange={(e) => patchRow(r.id, { endTime: e.target.value })}
                    className="border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                  />
                  <input
                    type="number"
                    min={1}
                    value={r.partySize}
                    onChange={(e) =>
                      patchRow(r.id, {
                        partySize: Number(e.target.value) || 1,
                      })
                    }
                    className="border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={r.firstName}
                    onChange={(e) =>
                      patchRow(r.id, { firstName: e.target.value })
                    }
                    className="border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                    placeholder="Prénom"
                  />
                  <input
                    value={r.lastName}
                    onChange={(e) =>
                      patchRow(r.id, { lastName: e.target.value })
                    }
                    className="border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                    placeholder="Nom"
                  />
                  <input
                    value={r.phone}
                    onChange={(e) => patchRow(r.id, { phone: e.target.value })}
                    className="border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                  />
                  <input
                    value={r.email}
                    onChange={(e) => patchRow(r.id, { email: e.target.value })}
                    className="border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                  />
                </div>
                <input
                  value={r.specialRequest || ""}
                  onChange={(e) =>
                    patchRow(r.id, { specialRequest: e.target.value || null })
                  }
                  placeholder="Demande client"
                  className="w-full border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                />
                <input
                  value={r.adminNotes || ""}
                  onChange={(e) =>
                    patchRow(r.id, { adminNotes: e.target.value || null })
                  }
                  placeholder="Note interne"
                  className="w-full border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                />
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    className="text-[#e0c878]"
                    onClick={() => void saveRow(r)}
                  >
                    Enregistrer
                  </button>
                  {r.status === "PENDING" ? (
                    <button
                      type="button"
                      className="text-emerald-300"
                      onClick={() => void setStatus(r.id, "CONFIRMED")}
                    >
                      Confirmer
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="text-[#c4a35a]"
                    onClick={() => void setStatus(r.id, "COMPLETED")}
                  >
                    Assis / Terminé
                  </button>
                  <button
                    type="button"
                    className="text-amber-200"
                    onClick={() => void setStatus(r.id, "NO_SHOW")}
                  >
                    No-show
                  </button>
                  <button
                    type="button"
                    className="text-red-300"
                    onClick={() => void setStatus(r.id, "CANCELLED")}
                  >
                    Annuler
                  </button>
                </div>
              </article>
            ))}
          </DeleteListShell>
        </div>
      )}
    </div>
  );
}
