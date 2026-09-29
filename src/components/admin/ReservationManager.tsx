"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminSelect } from "@/components/admin/AdminSelect";

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
  specialRequest: string | null;
  status: string;
  restaurantId: string;
  restaurantName: string;
};

type Props = {
  initial: Reservation[];
  restaurants: { id: string; name: string }[];
};

export function ReservationManager({ initial, restaurants }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    restaurantId: restaurants[0]?.id || "",
    date: "",
    startTime: "19:00",
    endTime: "21:00",
    partySize: 2,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequest: "",
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
    router.refresh();
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
        restaurantId: r.restaurantId,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        className="btn-gold text-sm"
        onClick={() => setShowCreate((v) => !v)}
      >
        {showCreate ? "Fermer" : "Nouvelle réservation"}
      </button>

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
            Début
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Fin
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
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
          <label className="text-sm sm:col-span-2">
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <button type="submit" disabled={pending} className="btn-gold sm:col-span-2">
            {pending ? "Enregistrement…" : "Créer"}
          </button>
        </form>
      ) : null}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {rows.length === 0 ? (
        <p className="border border-[#c4a35a]/20 p-6 text-sm text-[#a89f8e]">
          Aucune réservation à venir.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <article
              key={r.id}
              className="space-y-2 border border-[#c4a35a]/20 bg-[#12100e] p-4 text-sm"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <p className="text-[#e0c878]">{r.confirmationCode}</p>
                <span className="text-[#c4a35a]">{r.status}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  type="date"
                  value={r.date}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === r.id ? { ...x, date: e.target.value } : x,
                      ),
                    )
                  }
                  className="border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                />
                <input
                  type="time"
                  value={r.startTime}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === r.id ? { ...x, startTime: e.target.value } : x,
                      ),
                    )
                  }
                  className="border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                />
                <input
                  type="number"
                  min={1}
                  value={r.partySize}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === r.id
                          ? { ...x, partySize: Number(e.target.value) || 1 }
                          : x,
                      ),
                    )
                  }
                  className="border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={`${r.firstName}`}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === r.id ? { ...x, firstName: e.target.value } : x,
                      ),
                    )
                  }
                  className="border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                  placeholder="Prénom"
                />
                <input
                  value={r.lastName}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === r.id ? { ...x, lastName: e.target.value } : x,
                      ),
                    )
                  }
                  className="border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                  placeholder="Nom"
                />
                <input
                  value={r.phone}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === r.id ? { ...x, phone: e.target.value } : x,
                      ),
                    )
                  }
                  className="border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                />
                <input
                  value={r.email}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === r.id ? { ...x, email: e.target.value } : x,
                      ),
                    )
                  }
                  className="border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                />
              </div>
              <p className="text-xs text-[#a89f8e]">{r.restaurantName}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  className="text-[#e0c878]"
                  onClick={() => void saveRow(r)}
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  className="text-[#c4a35a]"
                  onClick={() => void setStatus(r.id, "CONFIRMED")}
                >
                  Confirmer
                </button>
                <button
                  type="button"
                  className="text-[#c4a35a]"
                  onClick={() => void setStatus(r.id, "COMPLETED")}
                >
                  Terminer
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
        </div>
      )}
    </div>
  );
}
