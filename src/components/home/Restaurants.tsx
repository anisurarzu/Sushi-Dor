const MAPS_LINK = "https://maps.app.goo.gl/38atS75trNpi3Y87A";
const INSTAGRAM_LINK = "https://www.instagram.com/sushi_dor_annemasse";

/** Official multicolor Google Maps pin mark */
function GoogleMapsLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path
        fill="#48B264"
        d="M37.5 26.4c0 5.1-5.4 11.6-11.4 17.5-1.1 1.1-2.9 1.1-4 0C16 38 10.5 31.5 10.5 26.4 10.5 18.7 16.7 12.5 24 12.5s13.5 6.2 13.5 13.9z"
      />
      <path
        fill="#F6BD00"
        d="M24 6c7.2 0 13.5 4.3 16.3 10.8C37.5 12.8 31.1 10 24 10S10.5 12.8 7.7 16.8C10.5 10.3 16.8 6 24 6z"
      />
      <path
        fill="#E94335"
        d="M40.3 16.8C41.4 19 42 21.6 42 24.3c0 5.8-3.9 11.5-9.3 17.2 4.3-5.1 7-10.5 7-15.1 0-3.4-.9-6.5-2.4-9.2-.3-.2-.6-.3-1-.4z"
      />
      <path
        fill="#4285F4"
        d="M7.7 16.8C6.2 19.5 5.3 22.6 5.3 26c0 4.6 2.7 10 7 15.1C6.9 35.4 3 29.7 3 24.3c0-2.7.6-5.3 1.7-7.5.4.1.7.2 1 .4 1.1-.2 1.6-.3 2-.4z"
      />
      <circle fill="#1A73E8" cx="24" cy="24" r="7.5" />
      <circle fill="#fff" cx="24" cy="24" r="4.2" />
    </svg>
  );
}

/** Instagram glyph with brand gradient */
function InstagramLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden
      focusable="false"
    >
      <defs>
        <radialGradient
          id="ig-grad"
          cx="30%"
          cy="107%"
          r="150%"
          fx="30%"
          fy="107%"
        >
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ig-grad)" />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        d="M16 10h16a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6z"
      />
      <circle cx="24" cy="24" r="6.5" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="33.2" cy="14.8" r="2" fill="#fff" />
    </svg>
  );
}

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
            <span className="gold-text">Annemasse</span>
          </h2>
          <p className="mt-4 text-mist">
            Un seul restaurant Sushi D&apos;or, en Haute-Savoie — à Annemasse.
          </p>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="border border-[color:var(--line)] bg-ink p-8 md:p-10">
            <h3 className="font-[family-name:var(--font-display)] text-3xl text-champagne">
              Sushi D&apos;or
            </h3>
            <p className="mt-3 text-sm uppercase tracking-[0.16em] text-gold">
              Haute-Savoie · France
            </p>
            <dl className="mt-8 space-y-4 text-sm text-mist">
              <div>
                <dt className="text-[0.68rem] uppercase tracking-[0.18em] text-gold">
                  Adresse
                </dt>
                <dd className="mt-1 text-champagne">
                  37 Rue du Chablais
                  <br />
                  74100 Annemasse
                </dd>
              </div>
              <div>
                <dt className="text-[0.68rem] uppercase tracking-[0.18em] text-gold">
                  Téléphone
                </dt>
                <dd className="mt-1">
                  <a
                    href="tel:+33450384279"
                    className="text-champagne hover:text-gold"
                  >
                    04 50 38 42 79
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[0.68rem] uppercase tracking-[0.18em] text-gold">
                  E-mail
                </dt>
                <dd className="mt-1">
                  <a
                    href="mailto:sushidorannemasse@gmail.com"
                    className="text-champagne hover:text-gold"
                  >
                    sushidorannemasse@gmail.com
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[0.68rem] uppercase tracking-[0.18em] text-gold">
                  Services
                </dt>
                <dd className="mt-1 text-champagne">
                  À emporter · Sur place
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col justify-center gap-4 border border-[color:var(--line)] bg-ink p-6 sm:p-8">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-gold">
              Nous suivre
            </p>
            <p className="max-w-sm text-sm text-mist">
              Itinéraire et photos du restaurant — un clic suffit.
            </p>

            <div className="mt-2 flex flex-col gap-3">
              <a
                href={MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 border border-[color:var(--line)] bg-ink-soft/40 px-4 py-4 transition-colors hover:border-gold hover:bg-gold/5"
                aria-label="Ouvrir Sushi D'or sur Google Maps"
              >
                <GoogleMapsLogo className="h-12 w-12 shrink-0" />
                <span className="min-w-0 text-left">
                  <span className="block text-sm font-medium text-champagne group-hover:text-gold-bright">
                    Google Maps
                  </span>
                  <span className="mt-0.5 block text-xs text-mist">
                    37 Rue du Chablais · Annemasse
                  </span>
                </span>
              </a>

              <a
                href={INSTAGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 border border-[color:var(--line)] bg-ink-soft/40 px-4 py-4 transition-colors hover:border-gold hover:bg-gold/5"
                aria-label="Suivre @sushi_dor_annemasse sur Instagram"
              >
                <InstagramLogo className="h-12 w-12 shrink-0" />
                <span className="min-w-0 text-left">
                  <span className="block text-sm font-medium text-champagne group-hover:text-gold-bright">
                    Instagram
                  </span>
                  <span className="mt-0.5 block text-xs text-mist">
                    @sushi_dor_annemasse
                  </span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
