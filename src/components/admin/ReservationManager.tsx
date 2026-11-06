"use client";

import Link from "next/link";
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
import { ReservationCalendar } from "@/components/reservation/ReservationCalendar";
import {
  OCCASIONS,
  RESERVATION_SOURCE_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
} from "@/lib/reservation-options";

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

const STATUS_OPTIONS = RESERVATION_STATUS_OPTIONS.map((o) => ({ ...o }));
const SOURCE_OPTIONS = RESERVATION_SOURCE_OPTIONS.map((o) => ({ ...o }));
const OCCASION_OPTIONS = OCCASIONS.map((o) => ({
  value: o.value === "none" ? "" : o.value,
  label: o.label,
}));

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-amber-200",
  CONFIRMED: "text-emerald-300",
  COMPLETED: "text-[#c4a35a]",
  NO_SHOW: "text-orange-300",
  CANCELLED: "text-red-300",
};

const TIME_OPTIONS = Array.from({ length: (23 - 11) * 2 + 1 }, (_, i) => {
  const minutes = 11 * 60 + i * 30;
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  const value = `${h}:${m}`;
  return { value, label: value };
});

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function statusLabel(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
}

function sourceLabel(source: string) {
  return SOURCE_OPTIONS.find((s) => s.value === source)?.label || source;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterRestaurant, setFilterRestaurant] = useState("");
  const [query, setQuery] = useState("");
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
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterSource && r.source !== filterSource) return false;
      if (filterRestaurant && r.restaurantId !== filterRestaurant) return false;
      if (!q) return true;
      return (
        r.confirmationCode.toLowerCase().includes(q) ||
        r.firstName.toLowerCase().includes(q) ||
        r.lastName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
      );
    });
  }, [rows, filterDate, filterStatus, filterSource, filterRestaurant, query]);

  const bulk = useBulkDelete({
    resource: "reservations",
    ids: filtered.map((r) => r.id),
    label: "réservation(s)",
  });

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
    setPending(true);
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
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  function patchRow(id: string, patch: Partial<Reservation>) {
    setRows((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    );
  }

  const editing = editingId ? rows.find((r) => r.id === editingId) : null;

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
            Résultats
          </p>
          <p className="mt-1 text-2xl text-[#e0c878]">{filtered.length}</p>
          <p className="text-xs text-[#a89f8e]">sur {rows.length} chargée(s)</p>
        </div>
      </div>

      <div className="grid gap-2 border border-[#c4a35a]/20 bg-[#12100e] p-3 sm:grid-cols-2 lg:grid-cols-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher code, nom, e-mail, tél…"
          className="border border-[#c4a35a]/25 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[#c4a35a] lg:col-span-2"
        />
        <AdminSelect
          aria-label="Statut"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[{ value: "", label: "Tous statuts" }, ...STATUS_OPTIONS]}
        />
        <AdminSelect
          aria-label="Source"
          value={filterSource}
          onChange={setFilterSource}
          options={[{ value: "", label: "Toutes sources" }, ...SOURCE_OPTIONS]}
        />
        <AdminSelect
          aria-label="Restaurant"
          value={filterRestaurant}
          onChange={setFilterRestaurant}
          options={[
            { value: "", label: "Tous restaurants" },
            ...restaurants.map((r) => ({ value: r.id, label: r.name })),
          ]}
        />
        <div className="flex flex-wrap items-center gap-2 lg:col-span-6">
          <button
            type="button"
            className={`border px-3 py-2 text-xs ${
              filterDate === todayStr()
                ? "border-[#c4a35a] text-[#e0c878]"
                : "border-[#c4a35a]/25 text-[#a89f8e]"
            }`}
            onClick={() => setFilterDate(todayStr())}
          >
            Aujourd&apos;hui
          </button>
          <button
            type="button"
            className="border border-[#c4a35a]/25 px-3 py-2 text-xs text-[#a89f8e]"
            onClick={() => {
              setFilterDate("");
              setFilterStatus("");
              setFilterSource("");
              setFilterRestaurant("");
              setQuery("");
            }}
          >
            Réinitialiser
          </button>
          <button
            type="button"
            className="btn-gold ml-auto text-sm"
            onClick={() => {
              setShowCreate((v) => !v);
              setEditingId(null);
            }}
          >
            {showCreate ? "Fermer" : "Nouvelle réservation"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <div>
          <p className="mb-2 text-[0.65rem] uppercase tracking-[0.16em] text-[#c4a35a]">
            Calendrier filtre
          </p>
          <ReservationCalendar
            value={filterDate || todayStr()}
            today={todayStr()}
            onChange={(d) => setFilterDate(d)}
          />
          {filterDate ? (
            <button
              type="button"
              className="mt-2 text-xs text-[#a89f8e] underline"
              onClick={() => setFilterDate("")}
            >
              Effacer la date ({filterDate})
            </button>
          ) : (
            <p className="mt-2 text-xs text-[#a89f8e]">
              Cliquez une date pour filtrer.
            </p>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          {showCreate ? (
            <form
              onSubmit={create}
              className="grid gap-3 border border-[#c4a35a]/20 bg-[#12100e] p-4 sm:grid-cols-2"
            >
              <p className="sm:col-span-2 font-[family-name:var(--font-display)] text-xl text-[#e0c878]">
                Nouvelle réservation
              </p>
              <div className="text-sm">
                <span className="mb-1 block text-[#a89f8e]">Restaurant</span>
                <AdminSelect
                  aria-label="Restaurant"
                  value={form.restaurantId}
                  onChange={(v) => setForm({ ...form, restaurantId: v })}
                  options={restaurants.map((r) => ({
                    value: r.id,
                    label: r.name,
                  }))}
                />
              </div>
              <div className="text-sm">
                <span className="mb-1 block text-[#a89f8e]">Source</span>
                <AdminSelect
                  aria-label="Source"
                  value={form.source}
                  onChange={(v) => setForm({ ...form, source: v })}
                  options={SOURCE_OPTIONS}
                />
              </div>
              <div className="sm:col-span-2">
                <p className="mb-2 text-[0.65rem] uppercase tracking-[0.14em] text-[#c4a35a]">
                  Date
                </p>
                <ReservationCalendar
                  value={form.date}
                  today={todayStr()}
                  onChange={(d) => setForm({ ...form, date: d })}
                />
              </div>
              <div className="text-sm">
                <span className="mb-1 block text-[#a89f8e]">Heure</span>
                <AdminSelect
                  aria-label="Heure"
                  value={form.startTime}
                  onChange={(v) => setForm({ ...form, startTime: v })}
                  options={TIME_OPTIONS}
                />
              </div>
              <div className="text-sm">
                <span className="mb-1 block text-[#a89f8e]">Statut</span>
                <AdminSelect
                  aria-label="Statut"
                  value={form.status}
                  onChange={(v) => setForm({ ...form, status: v })}
                  options={STATUS_OPTIONS}
                />
              </div>
              <label className="text-sm">
                Convives
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.partySize}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      partySize: Number(e.target.value) || 1,
                    })
                  }
                  className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2.5"
                />
              </label>
              <div className="text-sm">
                <span className="mb-1 block text-[#a89f8e]">Occasion</span>
                <AdminSelect
                  aria-label="Occasion"
                  value={form.occasion}
                  onChange={(v) => setForm({ ...form, occasion: v })}
                  options={OCCASION_OPTIONS}
                  placeholder="Aucune"
                />
              </div>
              <label className="text-sm">
                Prénom
                <input
                  required
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2.5"
                />
              </label>
              <label className="text-sm">
                Nom
                <input
                  required
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2.5"
                />
              </label>
              <label className="text-sm">
                Téléphone
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2.5"
                />
              </label>
              <label className="text-sm">
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2.5"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                Demande client
                <input
                  value={form.specialRequest}
                  onChange={(e) =>
                    setForm({ ...form, specialRequest: e.target.value })
                  }
                  className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2.5"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                Note interne
                <input
                  value={form.adminNotes}
                  onChange={(e) =>
                    setForm({ ...form, adminNotes: e.target.value })
                  }
                  className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2.5"
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

          {editing ? (
            <div className="grid gap-3 border border-[#c4a35a]/35 bg-[#12100e] p-4 sm:grid-cols-2">
              <p className="sm:col-span-2 font-[family-name:var(--font-display)] text-xl text-[#e0c878]">
                Éditer {editing.confirmationCode}
              </p>
              <div className="sm:col-span-2">
                <ReservationCalendar
                  value={editing.date}
                  today={todayStr()}
                  onChange={(d) => patchRow(editing.id, { date: d })}
                />
              </div>
              <div className="text-sm">
                <span className="mb-1 block text-[#a89f8e]">Heure début</span>
                <AdminSelect
                  aria-label="Heure début"
                  value={editing.startTime}
                  onChange={(v) => patchRow(editing.id, { startTime: v })}
                  options={TIME_OPTIONS}
                />
              </div>
              <div className="text-sm">
                <span className="mb-1 block text-[#a89f8e]">Statut</span>
                <AdminSelect
                  aria-label="Statut réservation"
                  value={editing.status}
                  onChange={(v) => patchRow(editing.id, { status: v })}
                  options={STATUS_OPTIONS}
                />
              </div>
              <div className="text-sm">
                <span className="mb-1 block text-[#a89f8e]">Source</span>
                <AdminSelect
                  aria-label="Source réservation"
                  value={editing.source}
                  onChange={(v) => patchRow(editing.id, { source: v })}
                  options={SOURCE_OPTIONS}
                />
              </div>
              <div className="text-sm">
                <span className="mb-1 block text-[#a89f8e]">Occasion</span>
                <AdminSelect
                  aria-label="Occasion"
                  value={editing.occasion || ""}
                  onChange={(v) =>
                    patchRow(editing.id, { occasion: v || null })
                  }
                  options={OCCASION_OPTIONS}
                />
              </div>
              <label className="text-sm">
                Convives
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={editing.partySize}
                  onChange={(e) =>
                    patchRow(editing.id, {
                      partySize: Number(e.target.value) || 1,
                    })
                  }
                  className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2.5"
                />
              </label>
              <label className="text-sm">
                Prénom
                <input
                  value={editing.firstName}
                  onChange={(e) =>
                    patchRow(editing.id, { firstName: e.target.value })
                  }
                  className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2.5"
                />
              </label>
              <label className="text-sm">
                Nom
                <input
                  value={editing.lastName}
                  onChange={(e) =>
                    patchRow(editing.id, { lastName: e.target.value })
                  }
                  className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2.5"
                />
              </label>
              <label className="text-sm">
                Téléphone
                <input
                  value={editing.phone}
                  onChange={(e) =>
                    patchRow(editing.id, { phone: e.target.value })
                  }
                  className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2.5"
                />
              </label>
              <label className="text-sm">
                Email
                <input
                  value={editing.email}
                  onChange={(e) =>
                    patchRow(editing.id, { email: e.target.value })
                  }
                  className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2.5"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                Demande client
                <input
                  value={editing.specialRequest || ""}
                  onChange={(e) =>
                    patchRow(editing.id, {
                      specialRequest: e.target.value || null,
                    })
                  }
                  className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2.5"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                Note interne
                <input
                  value={editing.adminNotes || ""}
                  onChange={(e) =>
                    patchRow(editing.id, {
                      adminNotes: e.target.value || null,
                    })
                  }
                  className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2.5"
                />
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <button
                  type="button"
                  className="btn-gold"
                  disabled={pending}
                  onClick={() => void saveRow(editing)}
                >
                  {pending ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button
                  type="button"
                  className="border border-[#c4a35a]/25 px-3 py-2 text-sm text-[#a89f8e]"
                  onClick={() => setEditingId(null)}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          {filtered.length === 0 ? (
            <p className="border border-[#c4a35a]/20 p-8 text-center text-sm text-[#a89f8e]">
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

              <DeleteListShell pending={bulk.pending} skeletonCols={8}>
                <div className="space-y-3 lg:hidden">
                  {filtered.map((r) => (
                    <div
                      key={r.id}
                      className="flex gap-3 border border-[#c4a35a]/20 bg-[#12100e] p-4"
                    >
                      <RowCheckbox
                        checked={bulk.selected.has(r.id)}
                        onChange={() => bulk.toggle(r.id)}
                        disabled={bulk.pending}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2">
                          <span className="text-[#e0c878]">
                            {r.confirmationCode}
                          </span>
                          <span className={STATUS_COLOR[r.status]}>
                            {statusLabel(r.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[#c4bbaa]">
                          {r.firstName} {r.lastName} · {r.partySize}p
                        </p>
                        <p className="mt-1 text-xs text-[#a89f8e]">
                          {r.date} · {r.startTime} · {sourceLabel(r.source)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2 self-center">
                        <button
                          type="button"
                          className="border border-[#c4a35a]/40 px-3 py-2 text-xs text-[#e0c878]"
                          onClick={() => {
                            setEditingId(r.id);
                            setShowCreate(false);
                          }}
                        >
                          Éditer
                        </button>
                        <RowDeleteButtons
                          id={r.id}
                          resource="reservations"
                          label={r.confirmationCode}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto border border-[#c4a35a]/20 lg:block">
                  <table className="w-full min-w-[1100px] text-left text-sm">
                    <thead className="bg-[#12100e] text-[0.65rem] uppercase tracking-[0.12em] text-[#a89f8e]">
                      <tr>
                        <th className="w-10 px-3 py-3" />
                        <th className="px-3 py-3">Code</th>
                        <th className="px-3 py-3">Client</th>
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Heure</th>
                        <th className="px-3 py-3">Pax</th>
                        <th className="px-3 py-3">Source</th>
                        <th className="px-3 py-3">Statut</th>
                        <th className="px-3 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr
                          key={r.id}
                          className="border-t border-[#c4a35a]/15 hover:bg-white/[0.02]"
                        >
                          <td className="px-3 py-3">
                            <RowCheckbox
                              checked={bulk.selected.has(r.id)}
                              onChange={() => bulk.toggle(r.id)}
                              disabled={bulk.pending}
                            />
                          </td>
                          <td className="px-3 py-3 text-[#e0c878]">
                            {r.confirmationCode}
                          </td>
                          <td className="px-3 py-3">
                            {r.firstName} {r.lastName}
                            <span className="block text-xs text-[#a89f8e]">
                              {r.phone}
                            </span>
                          </td>
                          <td className="px-3 py-3">{r.date}</td>
                          <td className="px-3 py-3">{r.startTime}</td>
                          <td className="px-3 py-3">{r.partySize}</td>
                          <td className="px-3 py-3">{sourceLabel(r.source)}</td>
                          <td className={`px-3 py-3 ${STATUS_COLOR[r.status] || ""}`}>
                            <div className="min-w-[9rem]">
                              <AdminSelect
                                aria-label={`Statut ${r.confirmationCode}`}
                                value={r.status}
                                onChange={(v) => void setStatus(r.id, v)}
                                options={STATUS_OPTIONS}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                className="border border-[#c4a35a]/40 px-2.5 py-1 text-xs text-[#e0c878] hover:bg-[#c4a35a]/10"
                                onClick={() => {
                                  setEditingId(r.id);
                                  setShowCreate(false);
                                }}
                              >
                                Éditer
                              </button>
                              {r.status === "PENDING" ? (
                                <button
                                  type="button"
                                  className="text-xs text-emerald-300"
                                  onClick={() =>
                                    void setStatus(r.id, "CONFIRMED")
                                  }
                                >
                                  Confirmer
                                </button>
                              ) : null}
                              <RowDeleteButtons
                                id={r.id}
                                resource="reservations"
                                label={r.confirmationCode}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DeleteListShell>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-[#a89f8e]">
        Astuce : sélectionnez une ou plusieurs lignes pour soft/hard delete —
        comme sur{" "}
        <Link href="/admin/orders" className="text-[#c4a35a] underline">
          Commandes
        </Link>
        .
      </p>
    </div>
  );
}
