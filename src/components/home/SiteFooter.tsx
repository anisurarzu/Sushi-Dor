export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-[color:var(--line)] bg-ink">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-3 md:px-10">
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl text-champagne">
            Sushi <span className="gold-text">D&apos;or</span>
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist">
            Restaurants de sushi, livraison et à emporter. Qualité, fraîcheur
            et l&apos;élégance du doré japonais.
          </p>
        </div>

        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-gold">
            Informations
          </p>
          <ul className="mt-4 space-y-2 text-sm text-mist">
            <li>
              <a href="#carte" className="hover:text-champagne">
                La carte
              </a>
            </li>
            <li>
              <a href="#restaurants" className="hover:text-champagne">
                Restaurants
              </a>
            </li>
            <li>
              <a href="#fidelite" className="hover:text-champagne">
                Fidélité
              </a>
            </li>
            <li>
              <a href="mailto:contact@sushidor.fr" className="hover:text-champagne">
                contact@sushidor.fr
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-gold">
            Newsletter
          </p>
          <p className="mt-4 text-sm text-mist">
            Offres exclusives et nouveautés de saison.
          </p>
          <form className="mt-4 flex border border-[color:var(--line)]">
            <input
              type="email"
              placeholder="Votre email"
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-bone outline-none placeholder:text-mist/60"
              aria-label="Email newsletter"
            />
            <button type="submit" className="btn-gold rounded-none border-0">
              OK
            </button>
          </form>
        </div>
      </div>
      <div className="gold-rule" />
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-xs text-mist md:flex-row md:justify-between md:px-10">
        <p>© {new Date().getFullYear()} Sushi D&apos;or. Tous droits réservés.</p>
        <p>Mentions légales · CGV · Confidentialité</p>
      </div>
    </footer>
  );
}
