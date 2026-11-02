import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-[color:var(--line)] bg-ink">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2 md:px-10">
        <div>
          <BrandLogo as="p" size="footer" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist">
            Cuisine japonaise à Annemasse (Haute-Savoie).
          </p>
          <p className="mt-3 max-w-xs text-sm text-mist">
            <a
              href="https://maps.app.goo.gl/38atS75trNpi3Y87A"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-champagne"
            >
              37 Rue du Chablais, 74100 Annemasse
            </a>
          </p>
        </div>

        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-gold">
            Informations
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
            <li>
              <a
                href="https://maps.app.goo.gl/38atS75trNpi3Y87A"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-champagne"
              >
                Google Maps
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="gold-rule" />
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-xs text-mist md:flex-row md:justify-between md:px-10">
        <p>© {new Date().getFullYear()} Sushi D&apos;or. Tous droits réservés.</p>
        <p>This site is under construction</p>
      </div>
    </footer>
  );
}
