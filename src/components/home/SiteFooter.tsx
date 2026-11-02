import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

const MAPS_LINK = "https://maps.app.goo.gl/38atS75trNpi3Y87A";

function GoogleMapsIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
      />
      <circle fill="#fff" cx="12" cy="9" r="2.6" />
      <path
        fill="#FBBC04"
        d="M12 2c-1.1 0-2.13.26-3.05.71L12 12l7-7.75C17.87 2.9 15.13 2 12 2z"
        opacity="0.35"
      />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-[color:var(--line)] bg-ink">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2 md:px-10 lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
        <div>
          <BrandLogo as="p" size="footer" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist">
            Cuisine japonaise à Annemasse (Haute-Savoie).
          </p>
          <a
            href={MAPS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-3 border border-[color:var(--line)] bg-ink-soft/60 px-4 py-3 transition-colors hover:border-gold hover:bg-gold/5"
            aria-label="Ouvrir Sushi D'or sur Google Maps"
          >
            <span className="flex h-11 w-11 items-center justify-center border border-[color:var(--line)] bg-ink">
              <GoogleMapsIcon className="h-6 w-6" />
            </span>
            <span className="text-left">
              <span className="block text-[0.65rem] uppercase tracking-[0.16em] text-gold">
                Google Maps
              </span>
              <span className="mt-0.5 block text-sm text-champagne">
                37 Rue du Chablais, Annemasse
              </span>
            </span>
          </a>
        </div>

        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-gold">
            Contact
          </p>
          <ul className="mt-4 space-y-2 text-sm text-mist">
            <li>
              <a
                href={MAPS_LINK}
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
              <a href="tel:+33450384279" className="hover:text-champagne">
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
          <ul className="mt-4 space-y-2 text-sm text-mist">
            <li>
              <Link href="/menu" className="hover:text-champagne">
                La carte
              </Link>
            </li>
            <li>
              <Link href="/#restaurants" className="hover:text-champagne">
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
