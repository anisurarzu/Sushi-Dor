"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { CartBadge } from "@/components/cart/CartBadge";

const links = [
  { href: "/menu", label: "La carte" },
  { href: "/#restaurants", label: "Restaurant" },
  { href: "/#contact", label: "Contact" },
  { href: "/compte", label: "Compte" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6 sm:py-6 md:px-10">
        <Link href="/" className="group relative z-10 min-w-0 shrink">
          <BrandLogo size="header" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
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

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <CartBadge />
          <Link
            href="/menu"
            className="header-cta header-cta--gold shrink-0"
          >
            Commander
          </Link>
          <button
            type="button"
            className="site-header-menu-btn lg:hidden"
            aria-expanded={open}
            aria-controls="site-mobile-nav"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Fermer" : "Menu"}</span>
            <span className={`site-header-menu-btn__bars ${open ? "is-open" : ""}`} aria-hidden>
              <i />
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="site-mobile-nav"
          className="site-mobile-nav lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <button
            type="button"
            className="site-mobile-nav__backdrop"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
          />
          <nav className="site-mobile-nav__panel" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="site-mobile-nav__link"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/menu"
              className="btn-gold mt-4 w-full"
              onClick={() => setOpen(false)}
            >
              Commander
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
