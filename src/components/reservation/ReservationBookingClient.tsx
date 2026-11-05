"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Meta = {
  restaurant: {
    id: string;
    name: string;
    address: string;
    postalCode: string;
    city: string;
    phone: string | null;
    maxPartySize: number;
    maxAdvanceDays: number;
    minAdvanceMinutes: number;
  };
  occasions: { value: string; label: string }[];
};

type Slot = {
  startTime: string;
  endTime: string;
  remainingGuests: number;
  available: boolean;
};

type Step = "party" | "datetime" | "details" | "review";

function todayParis() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${dateStr}T12:00:00.000Z`));
}

export function ReservationBookingClient({ initialMeta }: { initialMeta: Meta }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("party");
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState(todayParis());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [closedReason, setClosedReason] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    occasion: "none",
    specialRequest: "",
  });

  const minDate = todayParis();
  const maxDate = addDays(minDate, initialMeta.restaurant.maxAdvanceDays);
  const availableSlots = useMemo(
    () => slots.filter((s) => s.available),
    [slots],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingSlots(true);
      setError(null);
      setClosedReason(null);
      setStartTime(null);
      try {
        const qs = new URLSearchParams({
          restaurantId: initialMeta.restaurant.id,
          date,
          partySize: String(partySize),
        });
        const res = await fetch(`/api/reservations/availability?${qs}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setSlots([]);
          setClosedReason(data.error || "Créneaux indisponibles.");
          return;
        }
        setSlots(data.slots || []);
        setClosedReason(data.closedReason);
      } catch {
        if (!cancelled) {
          setSlots([]);
          setClosedReason("Impossible de charger les créneaux.");
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [date, partySize, initialMeta.restaurant.id]);

  async function submit() {
    if (!startTime) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: initialMeta.restaurant.id,
          date,
          startTime,
          partySize,
          ...form,
          occasion: form.occasion === "none" ? null : form.occasion,
          specialRequest: form.specialRequest || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Réservation impossible.");
        setPending(false);
        return;
      }
      try {
        sessionStorage.setItem(
          `reservation:${data.reservation.confirmationCode}`,
          JSON.stringify({
            cancelToken: data.cancelToken,
            reservation: data.reservation,
            restaurant: initialMeta.restaurant,
          }),
        );
      } catch {
        /* ignore */
      }
      router.push(
        `/reservation/confirmation?code=${encodeURIComponent(data.reservation.confirmationCode)}`,
      );
    } catch {
      setError("Erreur réseau. Réessayez.");
      setPending(false);
    }
  }

  const steps: { id: Step; label: string }[] = [
    { id: "party", label: "Convives" },
    { id: "datetime", label: "Date & heure" },
    { id: "details", label: "Coordonnées" },
    { id: "review", label: "Confirmation" },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <ol className="mb-8 flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.16em] text-mist">
        {steps.map((s, i) => (
          <li
            key={s.id}
            className={
              step === s.id
                ? "border border-gold px-2.5 py-1 text-gold"
                : "border border-[color:var(--line)] px-2.5 py-1"
            }
          >
            {i + 1}. {s.label}
          </li>
        ))}
      </ol>

      {step === "party" ? (
        <section className="space-y-6">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-champagne sm:text-3xl">
              Combien serez-vous ?
            </h2>
            <p className="mt-2 text-sm text-mist">
              Jusqu&apos;à {initialMeta.restaurant.maxPartySize} convives en
              ligne. Au-delà, contactez-nous au{" "}
              {initialMeta.restaurant.phone || "restaurant"}.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {Array.from(
              { length: initialMeta.restaurant.maxPartySize },
              (_, i) => i + 1,
            ).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPartySize(n)}
                className={
                  partySize === n
                    ? "border border-gold bg-gold/15 py-3 text-gold"
                    : "border border-[color:var(--line)] py-3 text-bone hover:border-gold/60"
                }
              >
                {n}
              </button>
            ))}
          </div>
          {partySize >= 8 ? (
            <p className="text-sm text-amber-200/90">
              Les groupes de 8+ nécessitent une confirmation de l&apos;équipe.
            </p>
          ) : null}
          <button
            type="button"
            className="btn-gold"
            onClick={() => setStep("datetime")}
          >
            Continuer
          </button>
        </section>
      ) : null}

      {step === "datetime" ? (
        <section className="space-y-6">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-champagne sm:text-3xl">
              Choisissez votre créneau
            </h2>
            <p className="mt-2 text-sm text-mist">
              {partySize} convive{partySize > 1 ? "s" : ""} · réservation
              jusqu&apos;à {initialMeta.restaurant.maxAdvanceDays} jours à
              l&apos;avance
            </p>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-mist">Date</span>
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-[color:var(--line)] bg-ink-soft/60 px-3 py-2.5 text-bone"
            />
          </label>
          <p className="text-sm capitalize text-champagne">
            {formatDisplayDate(date)}
          </p>
          {loadingSlots ? (
            <p className="text-sm text-mist">Chargement des créneaux…</p>
          ) : closedReason ? (
            <p className="border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-100">
              {closedReason}
            </p>
          ) : availableSlots.length === 0 ? (
            <p className="border border-[color:var(--line)] px-4 py-3 text-sm text-mist">
              Aucun créneau disponible ce jour. Essayez une autre date.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {availableSlots.map((s) => (
                <button
                  key={s.startTime}
                  type="button"
                  onClick={() => setStartTime(s.startTime)}
                  className={
                    startTime === s.startTime
                      ? "border border-gold bg-gold/15 py-2.5 text-sm text-gold"
                      : "border border-[color:var(--line)] py-2.5 text-sm text-bone hover:border-gold/60"
                  }
                >
                  {s.startTime}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setStep("party")}
            >
              Retour
            </button>
            <button
              type="button"
              className="btn-gold"
              disabled={!startTime}
              onClick={() => setStep("details")}
            >
              Continuer
            </button>
          </div>
        </section>
      ) : null}

      {step === "details" ? (
        <section className="space-y-6">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-champagne sm:text-3xl">
              Vos coordonnées
            </h2>
            <p className="mt-2 text-sm text-mist">
              Nous vous enverrons la confirmation par e-mail.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Prénom *
              <input
                required
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                className="mt-1 w-full border border-[color:var(--line)] bg-ink-soft/60 px-3 py-2.5"
              />
            </label>
            <label className="text-sm">
              Nom *
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="mt-1 w-full border border-[color:var(--line)] bg-ink-soft/60 px-3 py-2.5"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              E-mail *
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full border border-[color:var(--line)] bg-ink-soft/60 px-3 py-2.5"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Téléphone *
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full border border-[color:var(--line)] bg-ink-soft/60 px-3 py-2.5"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Occasion
              <select
                value={form.occasion}
                onChange={(e) => setForm({ ...form, occasion: e.target.value })}
                className="mt-1 w-full border border-[color:var(--line)] bg-ink-soft/60 px-3 py-2.5"
              >
                {initialMeta.occasions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              Demande spéciale
              <textarea
                rows={3}
                maxLength={500}
                value={form.specialRequest}
                onChange={(e) =>
                  setForm({ ...form, specialRequest: e.target.value })
                }
                placeholder="Allergies, accessibilité, chaise haute…"
                className="mt-1 w-full border border-[color:var(--line)] bg-ink-soft/60 px-3 py-2.5"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setStep("datetime")}
            >
              Retour
            </button>
            <button
              type="button"
              className="btn-gold"
              disabled={
                !form.firstName ||
                !form.lastName ||
                !form.email ||
                !form.phone
              }
              onClick={() => setStep("review")}
            >
              Continuer
            </button>
          </div>
        </section>
      ) : null}

      {step === "review" ? (
        <section className="space-y-6">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-champagne sm:text-3xl">
              Vérifiez votre réservation
            </h2>
          </div>
          <dl className="space-y-3 border border-[color:var(--line)] bg-ink-soft/40 p-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-mist">Restaurant</dt>
              <dd className="text-right text-bone">
                {initialMeta.restaurant.name}
                <span className="mt-1 block text-xs text-mist">
                  {initialMeta.restaurant.address},{" "}
                  {initialMeta.restaurant.postalCode}{" "}
                  {initialMeta.restaurant.city}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-mist">Date</dt>
              <dd className="capitalize text-bone">
                {formatDisplayDate(date)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-mist">Heure</dt>
              <dd className="text-bone">{startTime}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-mist">Convives</dt>
              <dd className="text-bone">{partySize}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-mist">Contact</dt>
              <dd className="text-right text-bone">
                {form.firstName} {form.lastName}
                <span className="mt-1 block text-xs text-mist">
                  {form.email} · {form.phone}
                </span>
              </dd>
            </div>
          </dl>
          {partySize >= 8 ? (
            <p className="text-sm text-amber-200/90">
              Statut attendu : en attente de confirmation du restaurant.
            </p>
          ) : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setStep("details")}
              disabled={pending}
            >
              Retour
            </button>
            <button
              type="button"
              className="btn-gold"
              disabled={pending}
              onClick={() => void submit()}
            >
              {pending ? "Réservation…" : "Confirmer la réservation"}
            </button>
          </div>
          <p className="text-xs text-mist">
            En confirmant, vous acceptez d&apos;être contacté pour cette
            réservation.{" "}
            <Link href="/reservation/manage" className="text-gold underline">
              Gérer une réservation existante
            </Link>
          </p>
        </section>
      ) : null}
    </div>
  );
}
