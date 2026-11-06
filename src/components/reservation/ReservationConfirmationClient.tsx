"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stored = {
  cancelToken: string;
  reservation: {
    confirmationCode: string;
    status: string;
    date: string;
    startTime: string;
    partySize: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  restaurant: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    phone: string | null;
  };
};

function formatDisplayDate(dateStr: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${dateStr}T12:00:00.000Z`));
}

export function ReservationConfirmationClient({ code }: { code: string }) {
  const [data, setData] = useState<Stored | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`reservation:${code}`);
      if (raw) setData(JSON.parse(raw) as Stored);
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => setPhase("ready"), 1100);
    return () => window.clearTimeout(t);
  }, [code]);

  if (phase === "loading") {
    return (
      <div className="reservation-confirm-load" aria-live="polite" aria-busy="true">
        <div className="reservation-confirm-load__ring" aria-hidden>
          <span />
        </div>
        <p className="reservation-confirm-load__title">Confirmation en cours…</p>
        <p className="reservation-confirm-load__hint">
          Nous finalisons votre table
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="reservation-confirm-success">
        <div className="reservation-confirm-badge" aria-hidden>
          <svg viewBox="0 0 52 52" className="reservation-confirm-check">
            <circle className="reservation-confirm-check__circle" cx="26" cy="26" r="24" fill="none" />
            <path className="reservation-confirm-check__mark" fill="none" d="M14.5 27.5l7.2 7.2 15.8-16" />
          </svg>
        </div>
        <p className="reservation-confirm-kicker">Réservation enregistrée</p>
        <h2 className="reservation-confirm-headline">
          Merci — code{" "}
          <span className="gold-text">{code}</span>
        </h2>
        <p className="mt-3 text-mist">
          Consultez votre e-mail pour le lien de gestion, ou retrouvez-la avec
          votre code.
        </p>
        <Link
          href={`/reservation/manage?code=${encodeURIComponent(code)}`}
          className="btn-gold mt-6 inline-flex"
        >
          Gérer ma réservation
        </Link>
      </div>
    );
  }

  const { reservation: r, restaurant, cancelToken } = data;
  const pending = r.status === "PENDING";

  return (
    <div className="reservation-confirm-success">
      <div className="reservation-confirm-badge" aria-hidden>
        <svg viewBox="0 0 52 52" className="reservation-confirm-check">
          <circle className="reservation-confirm-check__circle" cx="26" cy="26" r="24" fill="none" />
          <path className="reservation-confirm-check__mark" fill="none" d="M14.5 27.5l7.2 7.2 15.8-16" />
        </svg>
      </div>

      <p className="reservation-confirm-kicker">
        {pending ? "Demande reçue" : "Réservation confirmée"}
      </p>
      <h2 className="reservation-confirm-headline">
        Félicitations, {r.firstName}&nbsp;!
      </h2>
      <p className="reservation-confirm-sub">
        {pending
          ? "Notre équipe vous confirmera rapidement. Un e-mail vient de partir."
          : "Votre table vous attend. Un e-mail de confirmation vous a été envoyé."}
      </p>

      <div className="reservation-confirm-code">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-gold">
          Code de confirmation
        </p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-champagne sm:text-4xl">
          {r.confirmationCode}
        </p>
      </div>

      <dl className="reservation-confirm-details">
        <div>
          <dt>Restaurant</dt>
          <dd>
            {restaurant.name}
            <span>
              {restaurant.address}, {restaurant.postalCode} {restaurant.city}
            </span>
          </dd>
        </div>
        <div>
          <dt>Date & heure</dt>
          <dd className="capitalize">
            {formatDisplayDate(r.date)} · {r.startTime}
          </dd>
        </div>
        <div>
          <dt>Convives</dt>
          <dd>{r.partySize}</dd>
        </div>
        <div>
          <dt>Au nom de</dt>
          <dd>
            {r.firstName} {r.lastName}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/reservation/manage?token=${encodeURIComponent(cancelToken)}`}
          className="btn-gold"
        >
          Gérer / Annuler
        </Link>
        <Link href="/menu" className="btn-ghost">
          Voir la carte
        </Link>
      </div>
    </div>
  );
}
