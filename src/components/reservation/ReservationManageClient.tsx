"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ReservationView = {
  confirmationCode: string;
  status: string;
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
  canCancel: boolean;
  restaurant: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    phone: string | null;
  };
};

const STATUS_FR: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
  COMPLETED: "Terminée",
  NO_SHOW: "No-show",
};

export function ReservationManageClient({
  initialToken,
  initialCode,
}: {
  initialToken?: string;
  initialCode?: string;
}) {
  const [token, setToken] = useState(initialToken || "");
  const [code, setCode] = useState(initialCode || "");
  const [email, setEmail] = useState("");
  const [reservation, setReservation] = useState<ReservationView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function lookup(opts?: { token?: string; code?: string; email?: string }) {
    setPending(true);
    setError(null);
    setMessage(null);
    const t = opts?.token ?? token;
    const c = opts?.code ?? code;
    const e = opts?.email ?? email;
    const qs = new URLSearchParams();
    if (t) qs.set("token", t);
    else {
      qs.set("code", c);
      qs.set("email", e);
    }
    try {
      const res = await fetch(`/api/reservations/manage?${qs}`);
      const data = await res.json();
      if (!res.ok) {
        setReservation(null);
        setError(data.error || "Introuvable");
        setPending(false);
        return;
      }
      setReservation(data.reservation);
    } catch {
      setError("Erreur réseau.");
    }
    setPending(false);
  }

  useEffect(() => {
    if (initialToken) {
      void lookup({ token: initialToken });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  async function cancel() {
    if (!reservation?.canCancel) return;
    if (!window.confirm("Annuler cette réservation ?")) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/reservations/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          token
            ? { token }
            : { code: reservation.confirmationCode, email: reservation.email },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Annulation impossible");
        setPending(false);
        return;
      }
      setReservation(data.reservation);
      setMessage("Réservation annulée.");
    } catch {
      setError("Erreur réseau.");
    }
    setPending(false);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {!reservation ? (
        <form
          className="space-y-4 border border-[color:var(--line)] bg-ink-soft/40 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void lookup();
          }}
        >
          <p className="text-sm text-mist">
            Entrez votre code de confirmation et l&apos;e-mail utilisé pour la
            réservation.
          </p>
          <label className="block text-sm">
            Code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="mt-1 w-full border border-[color:var(--line)] bg-transparent px-3 py-2.5"
              placeholder="SDxxxxxx"
              required={!token}
            />
          </label>
          <label className="block text-sm">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-[color:var(--line)] bg-transparent px-3 py-2.5"
              required={!token}
            />
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button type="submit" className="btn-gold" disabled={pending}>
            {pending ? "Recherche…" : "Retrouver ma réservation"}
          </button>
        </form>
      ) : (
        <div className="space-y-5 border border-[color:var(--line)] bg-ink-soft/40 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-gold">
                {reservation.confirmationCode}
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-champagne">
                {STATUS_FR[reservation.status] || reservation.status}
              </h2>
            </div>
            <Link href="/reservation" className="text-xs text-gold underline">
              Nouvelle réservation
            </Link>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-mist">Restaurant</dt>
              <dd className="text-right">
                {reservation.restaurant.name}
                <span className="mt-1 block text-xs text-mist">
                  {reservation.restaurant.address}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-mist">Date</dt>
              <dd>
                {reservation.date} · {reservation.startTime}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-mist">Convives</dt>
              <dd>{reservation.partySize}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-mist">Nom</dt>
              <dd>
                {reservation.firstName} {reservation.lastName}
              </dd>
            </div>
            {reservation.specialRequest ? (
              <div className="flex justify-between gap-3">
                <dt className="text-mist">Demande</dt>
                <dd className="max-w-[60%] text-right">
                  {reservation.specialRequest}
                </dd>
              </div>
            ) : null}
          </dl>
          {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {reservation.canCancel ? (
            <button
              type="button"
              className="border border-red-400/40 px-4 py-2 text-sm text-red-300"
              disabled={pending}
              onClick={() => void cancel()}
            >
              Annuler la réservation
            </button>
          ) : null}
          {reservation.restaurant.phone ? (
            <p className="text-xs text-mist">
              Besoin d&apos;aide ?{" "}
              <a
                href={`tel:${reservation.restaurant.phone.replace(/\s/g, "")}`}
                className="text-gold"
              >
                {reservation.restaurant.phone}
              </a>
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
