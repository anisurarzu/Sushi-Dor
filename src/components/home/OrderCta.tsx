import Link from "next/link";

export function OrderCta() {
  return (
    <section
      id="commander"
      className="relative overflow-hidden px-6 py-28 md:px-10"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1583623025817-d180a2225852?auto=format&fit=crop&w=2200&q=80)",
        }}
      />
      <div className="absolute inset-0 bg-ink/80" />
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <p className="mb-4 text-[0.72rem] uppercase tracking-[0.3em] text-gold">
          Bientôt disponible
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-4xl text-bone md:text-5xl">
          Commande en ligne{" "}
          <span className="gold-text">en construction</span>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-mist">
          En attendant, consultez notre carte. La commande et la réservation en
          ligne arrivent bientôt pour Annemasse et Thonon-les-Bains.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/menu" className="btn-gold">
            Voir la carte
          </Link>
        </div>
      </div>
    </section>
  );
}
