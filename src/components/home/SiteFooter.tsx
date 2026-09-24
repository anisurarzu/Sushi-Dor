import Link from "next/link";

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-[color:var(--line)] bg-ink">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2 md:px-10">
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl text-champagne">
            Sushi <span className="gold-text">D&apos;or</span>
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist">
            Cuisine japonaise à Annemasse et Thonon-les-Bains (Haute-Savoie).
            Site en construction.
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
              <a href="/#restaurants" className="hover:text-champagne">
                Restaurant
              </a>
            </li>
            <li>
              <a
                href="mailto:contact@sushidor.fr"
                className="hover:text-champagne"
              >
                contact@sushidor.fr
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
