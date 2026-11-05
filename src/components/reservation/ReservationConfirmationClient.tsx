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

export function ReservationConfirmationClient({ code }: { code: string }) {
  const [data, setData] = useState<Stored | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`reservation:${code}`);
      if (raw) setData(JSON.parse(raw) as Stored);
    } catch {
      /* ignore */
    }
  }, [code]);

  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-mist">
          Réservation <span className="text-gold">{code}</span> enregistrée.
          Consultez votre e-mail pour le lien de gestion, ou retrouvez-la avec
          votre code.
        </p>
        <Link href={`/reservation/manage?code=${encodeURIComponent(code)}`} className="btn-gold inline-flex">
          Gérer ma réservation
        </Link>
      </div>
    );
  }

  const { reservation: r, restaurant, cancelToken } = data;
  const pending = r.status === "PENDING";

  return (
    <div className="space-y-6">
      <div className="border border-gold/40 bg-gold/5 p-5">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-gold">
          Code de confirmation
        </p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-champagne">
          {r.confirmationCode}
        </p>
        <p className="mt-2 text-sm text-mist">
          {pending
            ? "Demande reçue — notre équipe vous confirmera rapidement."
            : "Votre table est réservée. Un e-mail de confirmation vous a été envoyé."}
        </p>
      </div>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-mist">Restaurant</dt>
          <dd className="text-right">
            {restaurant.name}
            <span className="mt-1 block text-xs text-mist">
              {restaurant.address}, {restaurant.postalCode} {restaurant.city}
            </span>
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-mist">Date & heure</dt>
          <dd>
            {r.date} · {r.startTime}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-mist">Convives</dt>
          <dd>{r.partySize}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-mist">Au nom de</dt>
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
