import Link from "next/link";

const links = [
  { href: "/menu", label: "La carte" },
  { href: "/#restaurants", label: "Restaurant" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6 md:px-10">
        <Link href="/" className="group relative z-10 min-w-0">
          <span className="font-[family-name:var(--font-display)] text-xl tracking-[0.06em] text-champagne sm:text-2xl sm:tracking-[0.08em] md:text-[1.7rem]">
            Sushi <span className="gold-text">D&apos;or</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[0.72rem] uppercase tracking-[0.18em] text-mist transition-colors hover:text-champagne"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/menu"
          className="btn-gold shrink-0 px-3 py-2 text-[0.62rem] sm:px-4 sm:py-2.5 sm:text-[0.68rem]"
        >
          La carte
        </Link>
      </div>
    </header>
  );
}
