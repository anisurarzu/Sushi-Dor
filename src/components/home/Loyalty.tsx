export function Loyalty() {
  return (
    <section id="fidelite" className="bg-ink px-6 py-24 md:px-10 md:py-28">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-10 border border-[color:var(--line)] px-8 py-12 md:flex-row md:items-center md:justify-between md:px-14 md:py-16">
        <div className="max-w-xl">
          <p className="mb-3 text-[0.72rem] uppercase tracking-[0.28em] text-gold">
            Programme fidélité
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-bone md:text-4xl">
            Chez Sushi D&apos;or, la fidélité{" "}
            <span className="gold-text">récompensée</span>
          </h2>
          <p className="mt-4 text-mist">
            Activez votre carte de fidélité et profitez de{" "}
            <span className="text-champagne">5€ de remise immédiate</span> sur
            votre première commande en ligne.
          </p>
        </div>
        <a href="#contact" className="btn-gold shrink-0">
          Activer ma carte
        </a>
      </div>
    </section>
  );
}
