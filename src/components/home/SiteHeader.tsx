import Link from "next/link";

const links = [
  { href: "#carte", label: "La carte" },
  { href: "#signature", label: "Signatures" },
  { href: "#restaurants", label: "Restaurants" },
  { href: "#fidelite", label: "Fidélité" },
  { href: "#contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <Link href="/" className="group relative z-10">
          <span className="font-[family-name:var(--font-display)] text-2xl tracking-[0.08em] text-champagne md:text-[1.7rem]">
            Sushi <span className="gold-text">D&apos;or</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[0.72rem] uppercase tracking-[0.18em] text-mist transition-colors hover:text-champagne"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a href="#commander" className="btn-gold text-[0.68rem]">
          Commander
        </a>
      </div>
    </header>
  );
}
