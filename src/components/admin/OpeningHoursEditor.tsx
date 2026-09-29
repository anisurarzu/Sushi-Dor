"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const DAY_FR: Record<string, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

type Hour = {
  id?: string;
  dayOfWeek: (typeof DAYS)[number];
  openTime: string;
  closeTime: string;
  service: string;
  isClosed: boolean;
};

type Blocked = { id?: string; date: string; reason: string | null };

type Props = {
  restaurantId: string;
  restaurantName: string;
  initialHours: Hour[];
  initialBlocked: Blocked[];
};

export function OpeningHoursEditor({
  restaurantId,
  restaurantName,
  initialHours,
  initialBlocked,
}: Props) {
  const router = useRouter();
  const [hours, setHours] = useState<Hour[]>(() => {
    if (initialHours.length > 0) return initialHours;
    return DAYS.map((day) => ({
      dayOfWeek: day,
      openTime: "12:00",
      closeTime: "14:30",
      service: "ALL",
      isClosed: day === "MONDAY",
    }));
  });
  const [blocked, setBlocked] = useState(initialBlocked);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newBlock, setNewBlock] = useState("");
  const [newReason, setNewReason] = useState("");

  function addPeriod(day: (typeof DAYS)[number]) {
    setHours((prev) => [
      ...prev,
      {
        dayOfWeek: day,
        openTime: "18:30",
        closeTime: "22:30",
        service: "ALL",
        isClosed: false,
      },
    ]);
  }

  async function save() {
    setPending(true);
    setError(null);
    setSuccess(null);
    const res = await fetch("/api/admin/opening-hours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        hours,
        blockedDates: blocked,
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setSuccess("Horaires enregistrés.");
    router.refresh();
  }

  return (
    <section className="border border-[#c4a35a]/20 bg-[#12100e] p-4">
      <h2 className="text-lg text-[#f0e6c8]">{restaurantName}</h2>
      <div className="mt-4 space-y-4">
        {DAYS.map((day) => {
          const periods = hours.filter((h) => h.dayOfWeek === day);
          const closed = periods.every((p) => p.isClosed) && periods.length > 0;
          return (
            <div key={day} className="border-t border-[#c4a35a]/10 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-[#c4a35a]">{DAY_FR[day]}</p>
                <div className="flex gap-2 text-xs">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={closed}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setHours((prev) => [
                            ...prev.filter((h) => h.dayOfWeek !== day),
                            {
                              dayOfWeek: day,
                              openTime: "00:00",
                              closeTime: "00:00",
                              service: "ALL",
                              isClosed: true,
                            },
                          ]);
                        } else {
                          setHours((prev) => [
                            ...prev.filter((h) => h.dayOfWeek !== day),
                            {
                              dayOfWeek: day,
                              openTime: "12:00",
                              closeTime: "14:30",
                              service: "ALL",
                              isClosed: false,
                            },
                          ]);
                        }
                      }}
                    />
                    Fermé
                  </label>
                  {!closed ? (
                    <button
                      type="button"
                      className="text-[#e0c878]"
                      onClick={() => addPeriod(day)}
                    >
                      + Créneau
                    </button>
                  ) : null}
                </div>
              </div>
              {                      !closed
                ? periods.map((p) => {
                    const realIdx = hours.indexOf(p);
                    return (
                      <div
                        key={`${day}-${realIdx}`}
                        className="mt-2 flex flex-wrap items-center gap-2 text-sm"
                      >
                        <input
                          type="time"
                          value={p.openTime}
                          onChange={(e) =>
                            setHours((prev) =>
                              prev.map((h, i) =>
                                i === realIdx
                                  ? { ...h, openTime: e.target.value }
                                  : h,
                              ),
                            )
                          }
                          className="border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                        />
                        <span>→</span>
                        <input
                          type="time"
                          value={p.closeTime}
                          onChange={(e) =>
                            setHours((prev) =>
                              prev.map((h, i) =>
                                i === realIdx
                                  ? { ...h, closeTime: e.target.value }
                                  : h,
                              ),
                            )
                          }
                          className="border border-[#c4a35a]/25 bg-transparent px-2 py-1"
                        />
                        {periods.length > 1 ? (
                          <button
                            type="button"
                            className="text-red-300 text-xs"
                            onClick={() =>
                              setHours((prev) =>
                                prev.filter((_, i) => i !== realIdx),
                              )
                            }
                          >
                            Retirer
                          </button>
                        ) : null}
                      </div>
                    );
                  })
                : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t border-[#c4a35a]/15 pt-4">
        <h3 className="text-[0.65rem] uppercase tracking-wider text-[#c4a35a]">
          Dates bloquées / jours fériés
        </h3>
        <ul className="mt-2 space-y-1 text-sm">
          {blocked.map((b, i) => (
            <li key={`${b.date}-${i}`} className="flex justify-between gap-2">
              <span>
                {b.date}
                {b.reason ? ` — ${b.reason}` : ""}
              </span>
              <button
                type="button"
                className="text-red-300 text-xs"
                onClick={() =>
                  setBlocked((prev) => prev.filter((_, idx) => idx !== i))
                }
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            type="date"
            value={newBlock}
            onChange={(e) => setNewBlock(e.target.value)}
            className="border border-[#c4a35a]/25 bg-transparent px-2 py-1 text-sm"
          />
          <input
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Raison"
            className="border border-[#c4a35a]/25 bg-transparent px-2 py-1 text-sm"
          />
          <button
            type="button"
            className="text-sm text-[#e0c878]"
            onClick={() => {
              if (!newBlock) return;
              setBlocked((prev) => [
                ...prev,
                { date: newBlock, reason: newReason || null },
              ]);
              setNewBlock("");
              setNewReason("");
            }}
          >
            Ajouter
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-emerald-300">{success}</p> : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => void save()}
        className="btn-gold mt-4"
      >
        {pending ? "Enregistrement…" : "Enregistrer les horaires"}
      </button>
    </section>
  );
}
