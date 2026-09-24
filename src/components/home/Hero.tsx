import Link from "next/link";

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

      <div className="absolute inset-x-0 top-20 z-20 flex justify-center px-4 sm:top-24 sm:px-6 md:top-28">
        <p className="animate-rise border border-[color:var(--line)] bg-ink/70 px-3 py-2 text-center text-[0.58rem] uppercase tracking-[0.16em] text-gold backdrop-blur-sm sm:px-5 sm:py-2.5 sm:text-[0.68rem] sm:tracking-[0.22em] md:text-[0.72rem]">
          This site is under construction
        </p>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 pt-32 sm:px-6 sm:pb-16 sm:pt-36 md:px-10 md:pb-24">
        <p className="animate-rise mb-3 text-[0.62rem] uppercase tracking-[0.22em] text-gold sm:mb-5 sm:text-[0.72rem] sm:tracking-[0.35em]">
          Annemasse · Thonon-les-Bains · Haute-Savoie
        </p>
        <h1 className="animate-rise-delay font-[family-name:var(--font-display)] text-[clamp(2.6rem,11vw,7.2rem)] leading-[0.92] tracking-tight text-bone">
          Sushi <span className="gold-text">D&apos;or</span>
        </h1>
        <p className="animate-rise-delay-2 mt-4 max-w-xl text-sm leading-relaxed text-champagne/85 sm:mt-6 sm:text-base md:text-lg">
          Cuisine japonaise à Annemasse et Thonon-les-Bains. Découvrez notre
          carte — le site de commande en ligne arrive bientôt.
        </p>
        <div className="animate-rise-delay-2 mt-7 flex flex-wrap gap-3 sm:mt-10 sm:gap-4">
          <Link href="/menu" className="btn-gold">
            Voir la carte
          </Link>
          <a href="#restaurants" className="btn-ghost">
            Notre restaurant
          </a>
        </div>
      </div>
    </section>
  );
}
