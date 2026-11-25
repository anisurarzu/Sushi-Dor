import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { HeroVideos } from "@/components/home/HeroVideos";
import { showGrandOpeningBanner } from "@/lib/grand-opening";

export function Hero() {
  const teaseOpening = showGrandOpeningBanner();

  return (
    <section className="grain relative flex min-h-[100svh] items-end overflow-hidden">
      <HeroVideos />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(12,10,8,0.55) 0%, rgba(12,10,8,0.4) 35%, rgba(12,10,8,0.92) 100%), radial-gradient(ellipse at 70% 30%, rgba(196,163,90,0.16), transparent 55%)",
        }}
        aria-hidden
      />

      {teaseOpening ? (
        <div
          className="opening-marquee absolute inset-x-0 top-1/2 z-20 -translate-y-1/2"
          role="status"
          aria-label="Grande ouverture le 1er décembre 2026"
        >
          <div className="opening-marquee__fade" aria-hidden />
          <div className="opening-marquee__track">
            {[0, 1].map((copy) => (
              <div key={copy} className="opening-marquee__group" aria-hidden={copy === 1}>
                {Array.from({ length: 4 }, (_, i) => (
                  <span key={`${copy}-${i}`} className="opening-marquee__item">
                    Grande ouverture · 1er décembre 2026
                    <span className="opening-marquee__dot" aria-hidden>
                      ◆
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-36 md:px-10 md:pb-24">
        <BrandLogo as="h1" size="hero" className="animate-rise" fire />
        <p className="animate-rise-delay-2 mt-5 max-w-2xl text-[0.95rem] leading-relaxed text-champagne/90 sm:mt-7 sm:text-lg md:text-xl md:leading-relaxed">
          {teaseOpening
            ? "Nous ouvrons nos portes le 1er décembre — cuisine japonaise, fraîcheur et précision à Annemasse."
            : "Cuisine japonaise — fraîcheur, précision et excellence à chaque bouchée."}
        </p>
        <div className="animate-rise-delay-2 mt-7 flex w-full max-w-md flex-col gap-2.5 sm:mt-10 sm:max-w-none sm:flex-row sm:flex-wrap sm:gap-4">
          <Link href="/menu" className="btn-gold w-full sm:w-auto">
            Voir la carte
          </Link>
          <Link href="/reservation" className="btn-ghost w-full sm:w-auto">
            {teaseOpening ? "Réserver dès maintenant" : "Réserver une table"}
          </Link>
        </div>
      </div>
    </section>
  );
}
