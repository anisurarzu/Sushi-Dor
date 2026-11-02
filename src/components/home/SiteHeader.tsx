import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { CartBadge } from "@/components/cart/CartBadge";

const links = [
  { href: "/menu", label: "La carte" },
  { href: "/#restaurants", label: "Restaurant" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[color:var(--line)]/60 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 md:px-10">
        <Link href="/" className="group relative z-10 min-w-0">
          <BrandLogo size="header" />
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

        <div className="flex items-center gap-2 sm:gap-3">
          <CartBadge />
          <Link href="/menu" className="header-cta header-cta--gold shrink-0">
            Commander
          </Link>
        </div>
      </div>
    </header>
  );
}
