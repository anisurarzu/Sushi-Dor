"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatEuro } from "@/lib/pricing";

const STORAGE_KEY = "sd_print_station_v1";

type JobOrder = {
  orderNumber: string;
  type: string;
  totalCents: number;
  productsSubtotalCents: number;
  addonsSubtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  deliveryStreet: string | null;
  deliveryComplement: string | null;
  deliveryPostalCode: string | null;
  deliveryCity: string | null;
  deliveryNotes: string | null;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
  restaurant: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    phone: string | null;
  };
  items: {
    productNameSnapshot: string;
    quantity: number;
    unitPriceSnapshot: number;
    lineTotalCents: number;
    addons: {
      addonNameSnapshot: string;
      quantity: number;
      priceSnapshot: number;
    }[];
  }[];
};

type PrintJobDto = {
  id: string;
  orderId: string;
  createdAt: string;
  order: JobOrder;
};

type Saved = {
  secret: string;
};

function typeLabel(type: string) {
  if (type === "DELIVERY") return "Livraison";
  if (type === "DINE_IN") return "Sur place";
  return "À emporter";
}

function playChime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    o.start(now);
    o.stop(now + 0.5);
    window.setTimeout(() => void ctx.close(), 600);
  } catch {
    // ignore
  }
}

export function PrintStationClient() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("En attente…");
  const [queue, setQueue] = useState<PrintJobDto[]>([]);
  const [active, setActive] = useState<PrintJobDto | null>(null);
  const [keepAwake, setKeepAwake] = useState(true);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const printingRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Saved;
      if (parsed.secret) {
        setSecret(parsed.secret);
        setUnlocked(true);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!unlocked || !keepAwake) {
      void wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
      return;
    }
    let cancelled = false;
    async function requestLock() {
      try {
        if (!("wakeLock" in navigator)) return;
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          void lock.release();
          return;
        }
        wakeLockRef.current = lock;
      } catch {
        // iOS may deny until interaction / battery
      }
    }
    void requestLock();
    const onVis = () => {
      if (document.visibilityState === "visible") void requestLock();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      void wakeLockRef.current?.release().catch(() => {});
    };
  }, [unlocked, keepAwake]);

  const headers = useCallback(
    () => ({
      "x-print-agent-secret": secret,
      "content-type": "application/json",
      accept: "application/json",
    }),
    [secret],
  );

  const unlock = () => {
    const trimmed = secret.trim();
    if (!trimmed) {
      setError("Entrez le secret agent");
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ secret: trimmed }));
    setSecret(trimmed);
    setUnlocked(true);
    setError(null);
    playChime();
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUnlocked(false);
    setQueue([]);
    setActive(null);
  };

  const poll = useCallback(async () => {
    if (!secret || printingRef.current) return;
    try {
      const res = await fetch("/api/print/jobs?limit=10", {
        headers: headers(),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Erreur ${res.status}`);
        setStatus("Erreur");
        return;
      }
      setError(null);
      const jobs = (data.jobs || []) as PrintJobDto[];
      setQueue(jobs);
      setStatus(
        jobs.length === 0
          ? "En écoute — aucune commande"
          : `${jobs.length} ticket(s) en attente`,
      );

      for (const job of jobs) {
        if (!knownIds.current.has(job.id)) {
          knownIds.current.add(job.id);
          playChime();
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([120, 60, 120]);
          }
          setActive((prev) => prev ?? job);
          break;
        }
      }

      if (jobs.length > 0) {
        setActive((prev) => {
          if (prev && jobs.some((j) => j.id === prev.id)) return prev;
          return jobs[0];
        });
      } else {
        setActive(null);
      }
    } catch {
      setError("Réseau indisponible");
      setStatus("Hors ligne");
    }
  }, [secret, headers]);

  useEffect(() => {
    if (!unlocked) return;
    void poll();
    const id = window.setInterval(() => void poll(), 3000);
    return () => window.clearInterval(id);
  }, [unlocked, poll]);

  async function printActive() {
    if (!active || printingRef.current) return;
    printingRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const claim = await fetch(`/api/print/jobs/${active.id}/claim`, {
        method: "POST",
        headers: headers(),
        body: "{}",
      });
      const claimData = await claim.json();
      if (!claim.ok && claim.status !== 409) {
        throw new Error(claimData.error || "Claim impossible");
      }

      // iPhone: AirPrint dialog (nécessite une interaction utilisateur)
      window.print();

      await fetch(`/api/print/jobs/${active.id}/complete`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ ok: true }),
      });

      knownIds.current.delete(active.id);
      setActive(null);
      await poll();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Échec";
      setError(message);
      if (active) {
        await fetch(`/api/print/jobs/${active.id}/complete`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ ok: false, error: message }),
        }).catch(() => {});
      }
    } finally {
      printingRef.current = false;
      setBusy(false);
    }
  }

  async function skipJob() {
    if (!active) return;
    setBusy(true);
    try {
      await fetch(`/api/print/jobs/${active.id}/claim`, {
        method: "POST",
        headers: headers(),
        body: "{}",
      }).catch(() => {});
      await fetch(`/api/print/jobs/${active.id}/complete`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ ok: false, error: "Ignoré depuis iPhone" }),
      });
      knownIds.current.delete(active.id);
      setActive(null);
      await poll();
    } finally {
      setBusy(false);
    }
  }

  if (!unlocked) {
    return (
      <main className="print-station min-h-dvh bg-ink px-5 py-10 text-bone">
        <div className="mx-auto max-w-md">
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-gold">
            Sushi D&apos;or
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-champagne">
            Station iPhone
          </h1>
          <p className="mt-3 text-sm text-mist">
            Entrez le même secret que l&apos;agent laptop (
            <code className="text-gold">PRINT_AGENT_SECRET</code>). Les tickets
            s&apos;imprimeront via AirPrint.
          </p>
          <label className="mt-8 block text-[0.65rem] uppercase tracking-[0.14em] text-gold">
            Secret agent
          </label>
          <input
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="mt-2 w-full border border-[color:var(--line)] bg-ink-soft px-3 py-3 text-sm outline-none focus:border-gold"
            placeholder="PRINT_AGENT_SECRET"
          />
          {error ? (
            <p className="mt-3 text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={unlock}
            className="btn-gold mt-6 w-full cursor-pointer"
          >
            Ouvrir la station
          </button>
          <ol className="mt-8 list-decimal space-y-2 pl-4 text-sm text-mist">
            <li>iPhone et imprimante sur le même Wi‑Fi</li>
            <li>
              Réglages iPhone → Imprimantes → Epson en AirPrint (via Epson TM
              Utility si besoin)
            </li>
            <li>Safari → Partager → Sur l&apos;écran d&apos;accueil</li>
            <li>Garder cette page ouverte pendant le service</li>
          </ol>
        </div>
      </main>
    );
  }

  const order = active?.order;

  return (
    <main className="print-station min-h-dvh bg-ink text-bone">
      <div className="print-station-ui mx-auto max-w-lg px-4 py-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-gold">
              Station iPhone
            </p>
            <p className="mt-1 text-sm text-mist">{status}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="cursor-pointer text-[0.65rem] uppercase tracking-[0.12em] text-mist hover:text-champagne"
          >
            Quitter
          </button>
        </header>

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-mist">
          <input
            type="checkbox"
            checked={keepAwake}
            onChange={(e) => setKeepAwake(e.target.checked)}
            className="accent-[var(--gold)]"
          />
          Garder l&apos;écran allumé
        </label>

        {error ? (
          <p className="mt-4 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        {active && order ? (
          <section className="mt-6 border border-gold/40 bg-ink-soft p-4">
            <p className="text-[0.65rem] uppercase tracking-[0.16em] text-gold">
              Nouveau ticket
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-champagne">
              #{order.orderNumber}
            </h2>
            <p className="mt-1 text-gold">{typeLabel(order.type)}</p>
            <p className="mt-3 text-sm">
              {order.customerFirstName} {order.customerLastName} ·{" "}
              {order.customerPhone}
            </p>
            <p className="mt-2 text-lg text-gold">
              {formatEuro(order.totalCents)}
            </p>
            <ul className="mt-4 space-y-1 text-sm text-mist">
              {order.items.map((item, i) => (
                <li key={i}>
                  {item.quantity}× {item.productNameSnapshot}
                </li>
              ))}
            </ul>

            <button
              type="button"
              disabled={busy}
              onClick={() => void printActive()}
              className="btn-gold mt-6 w-full cursor-pointer py-4 text-base disabled:opacity-60"
            >
              {busy ? "Impression…" : "Imprimer (AirPrint)"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void skipJob()}
              className="mt-3 w-full cursor-pointer py-2 text-[0.68rem] uppercase tracking-[0.12em] text-mist hover:text-champagne"
            >
              Ignorer
            </button>
          </section>
        ) : (
          <section className="mt-10 text-center">
            <div className="print-station-pulse mx-auto h-3 w-3 rounded-full bg-gold" />
            <p className="mt-6 font-[family-name:var(--font-display)] text-2xl text-champagne">
              En écoute
            </p>
            <p className="mt-2 text-sm text-mist">
              Quand une commande est payée, le ticket apparaît ici. Un tap
              suffit pour imprimer.
            </p>
          </section>
        )}

        {queue.length > 1 ? (
          <p className="mt-6 text-center text-xs text-mist">
            +{queue.length - 1} autre(s) en file
          </p>
        ) : null}

        <p className="mt-10 text-center text-[0.65rem] leading-relaxed text-mist/80">
          iPhone ne permet pas l&apos;impression 100% silencieuse. Pour
          l&apos;auto complète sans tap, gardez aussi l&apos;agent laptop.
        </p>
      </div>

      {/* AirPrint sheet */}
      {order ? (
        <article className="print-station-ticket" aria-hidden={!busy}>
          <h1>SUSHI D&apos;OR</h1>
          <p>{order.restaurant.name}</p>
          <p>
            {order.restaurant.address}
            <br />
            {order.restaurant.postalCode} {order.restaurant.city}
          </p>
          {order.restaurant.phone ? <p>{order.restaurant.phone}</p> : null}
          <hr />
          <p className="big">#{order.orderNumber}</p>
          <p>{typeLabel(order.type).toUpperCase()}</p>
          <p>
            {new Date(order.paidAt || order.createdAt).toLocaleString("fr-FR")}
          </p>
          <hr />
          <p>
            {order.customerFirstName} {order.customerLastName}
            <br />
            {order.customerPhone}
          </p>
          {order.type === "DELIVERY" ? (
            <p>
              {order.deliveryStreet}
              {order.deliveryComplement ? (
                <>
                  <br />
                  {order.deliveryComplement}
                </>
              ) : null}
              <br />
              {order.deliveryPostalCode} {order.deliveryCity}
            </p>
          ) : null}
          <hr />
          <ul>
            {order.items.map((item, i) => (
              <li key={i}>
                <strong>
                  {item.quantity}× {item.productNameSnapshot}
                </strong>{" "}
                {formatEuro(item.lineTotalCents)}
                {item.addons.map((a, j) => (
                  <div key={j} className="addon">
                    + {a.addonNameSnapshot}
                    {a.priceSnapshot > 0
                      ? ` ${formatEuro(a.priceSnapshot)}`
                      : ""}
                  </div>
                ))}
              </li>
            ))}
          </ul>
          <hr />
          <p>Sous-total {formatEuro(order.productsSubtotalCents)}</p>
          {order.addonsSubtotalCents > 0 ? (
            <p>Options {formatEuro(order.addonsSubtotalCents)}</p>
          ) : null}
          {order.deliveryFeeCents > 0 ? (
            <p>Livraison {formatEuro(order.deliveryFeeCents)}</p>
          ) : null}
          {order.discountCents > 0 ? (
            <p>Remise -{formatEuro(order.discountCents)}</p>
          ) : null}
          <p className="big">TOTAL {formatEuro(order.totalCents)}</p>
          <p>Payé — Stripe</p>
          {order.notes ? <p>Note: {order.notes}</p> : null}
          <p className="thanks">Merci et bon appétit !</p>
        </article>
      ) : null}
    </main>
  );
}
