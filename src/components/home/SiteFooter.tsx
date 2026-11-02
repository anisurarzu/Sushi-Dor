import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

const MAPS_LINK = "https://maps.app.goo.gl/38atS75trNpi3Y87A";
const MAPS_EMBED =
  "https://www.google.com/maps?q=SUSHI+D%27OR,+37+Rue+du+Chablais,+74100+Annemasse&hl=fr&z=16&output=embed";

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-[color:var(--line)] bg-ink">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-2 md:gap-12 md:px-10 md:py-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:items-stretch">
        <div className="flex flex-col justify-between gap-10">
          <div>
            <BrandLogo as="p" size="footer" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist">
              Cuisine japonaise à Annemasse (Haute-Savoie).
            </p>

            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-gold">
                  Contact
                </p>
                <ul className="mt-3 space-y-2 text-sm text-mist">
                  <li>
                    <a
                      href="https://maps.app.goo.gl/38atS75trNpi3Y87A"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="leading-relaxed hover:text-champagne"
                    >
                      37 Rue du Chablais
                      <br />
                      74100 Annemasse
                    </a>
                  </li>
                  <li>
                    <a
                      href="tel:+33450384279"
                      className="hover:text-champagne"
                    >
                      04 50 38 42 79
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:sushidorannemasse@gmail.com"
                      className="hover:text-champagne"
                    >
                      sushidorannemasse@gmail.com
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-gold">
                  Navigation
                </p>
                <ul className="mt-3 space-y-2 text-sm text-mist">
                  <li>
                    <Link href="/menu" className="hover:text-champagne">
                      La carte
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/#restaurants"
                      className="hover:text-champagne"
                    >
                      Restaurant
                    </Link>
                  </li>
                  <li>
                    <Link href="/cart" className="hover:text-champagne">
                      Panier
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-[240px] flex-col sm:min-h-[280px] lg:min-h-full">
          <div className="mb-3 flex items-end justify-between gap-3">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-gold">
              Nous trouver
            </p>
            <a
              href={MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.65rem] uppercase tracking-[0.14em] text-mist hover:text-champagne"
            >
              Ouvrir Maps →
            </a>
          </div>
          <div className="site-footer-map relative min-h-[240px] flex-1 overflow-hidden border border-[color:var(--line)] bg-ink-soft sm:min-h-[280px]">
            <iframe
              title="Sushi D'or — 37 Rue du Chablais, Annemasse"
              src={MAPS_EMBED}
              className="absolute inset-0 h-full w-full border-0 grayscale-[35%] contrast-[1.05] saturate-[0.75]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>

      <div className="gold-rule" />
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-xs text-mist md:flex-row md:justify-between md:px-10">
        <p>
          © {new Date().getFullYear()} Sushi D&apos;or. Tous droits réservés.
        </p>
        <p>Annemasse · Haute-Savoie</p>
      </div>
    </footer>
  );
}
