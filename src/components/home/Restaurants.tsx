export function Restaurants() {
  return (
    <section
      id="restaurants"
      className="bg-ink-soft px-6 py-24 md:px-10 md:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-[0.72rem] uppercase tracking-[0.28em] text-gold">
            Notre restaurant
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-4xl text-bone md:text-5xl">
            Annemasse · <span className="gold-text">Thonon</span>
          </h2>
          <p className="mt-4 text-mist">
            Un seul restaurant Sushi D&apos;or, en Haute-Savoie — au service
            d&apos;Annemasse et de Thonon-les-Bains.
          </p>
        </div>

        <div className="max-w-xl border border-[color:var(--line)] bg-ink p-8 md:p-10">
          <h3 className="font-[family-name:var(--font-display)] text-3xl text-champagne">
            Sushi D&apos;or
          </h3>
          <p className="mt-3 text-sm uppercase tracking-[0.16em] text-gold">
            Haute-Savoie · France
          </p>
          <dl className="mt-8 space-y-4 text-sm text-mist">
            <div>
              <dt className="text-[0.68rem] uppercase tracking-[0.18em] text-gold">
                Zone
              </dt>
              <dd className="mt-1 text-champagne">
                Annemasse · Thonon-les-Bains
              </dd>
            </div>
            <div>
              <dt className="text-[0.68rem] uppercase tracking-[0.18em] text-gold">
                Services
              </dt>
              <dd className="mt-1 text-champagne">
                À emporter · Sur place (détails à venir)
              </dd>
            </div>
          </dl>
          <p className="mt-8 text-xs leading-relaxed text-mist">
            Adresse exacte, horaires et livraison seront publiés ici dès la
            mise en ligne complète.
          </p>
        </div>
      </div>
    </section>
  );
}
