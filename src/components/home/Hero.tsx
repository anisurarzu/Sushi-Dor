export function Hero() {
  return (
    <section className="grain relative flex min-h-[100svh] items-end overflow-hidden">
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=2400&q=80)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(12,10,8,0.55) 0%, rgba(12,10,8,0.35) 35%, rgba(12,10,8,0.92) 100%), radial-gradient(ellipse at 70% 30%, rgba(196,163,90,0.18), transparent 55%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 pt-36 md:px-10 md:pb-24">
        <p className="animate-rise mb-5 text-[0.72rem] uppercase tracking-[0.35em] text-gold">
          Cuisine japonaise · France
        </p>
        <h1 className="animate-rise-delay font-[family-name:var(--font-display)] text-[clamp(3.2rem,9vw,7.2rem)] leading-[0.92] tracking-tight text-bone">
          Sushi <span className="gold-text">D&apos;or</span>
        </h1>
        <p className="animate-rise-delay-2 mt-6 max-w-xl text-base leading-relaxed text-champagne/85 md:text-lg">
          Fraîcheur absolue, précision artisanale. Sushis, makis et plats
          chauds préparés à la commande — livraison ou à emporter.
        </p>
        <div className="animate-rise-delay-2 mt-10 flex flex-wrap gap-4">
          <a href="#carte" className="btn-gold">
            Découvrir la carte
          </a>
          <a href="#commander" className="btn-ghost">
            Livraison &amp; emporter
          </a>
        </div>
      </div>
    </section>
  );
}
