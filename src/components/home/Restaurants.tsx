const cities = [
  { city: "Paris", detail: "8e · Opéra" },
  { city: "Lyon", detail: "Part-Dieu" },
  { city: "Bordeaux", detail: "Chartrons" },
  { city: "Nice", detail: "Centre-ville" },
];

export function Restaurants() {
  return (
    <section
      id="restaurants"
      className="bg-ink-soft px-6 py-24 md:px-10 md:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-[0.72rem] uppercase tracking-[0.28em] text-gold">
              Nos adresses
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl text-bone md:text-5xl">
              Restaurants en <span className="gold-text">France</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm text-mist">
            Trouvez le Sushi D&apos;or le plus proche — click &amp; collect ou
            livraison selon votre zone.
          </p>
        </div>

        <div className="grid gap-px bg-[color:var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          {cities.map((item) => (
            <div
              key={item.city}
              className="bg-ink-soft p-8 transition-colors hover:bg-ink"
            >
              <h3 className="font-[family-name:var(--font-display)] text-2xl text-champagne">
                {item.city}
              </h3>
              <p className="mt-2 text-sm text-mist">{item.detail}</p>
              <a
                href="#commander"
                className="mt-6 inline-block text-[0.68rem] uppercase tracking-[0.18em] text-gold hover:text-gold-bright"
              >
                Commander →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
