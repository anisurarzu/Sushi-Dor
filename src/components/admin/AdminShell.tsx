"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/orders", label: "Commandes" },
  { href: "/admin/reservations", label: "Réservations" },
  { href: "/admin/products", label: "Produits" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/addons", label: "Options" },
  { href: "/admin/restaurants", label: "Restaurants" },
  { href: "/admin/customers", label: "Clients" },
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/roles", label: "Rôles" },
  { href: "/admin/discounts", label: "Promos" },
  { href: "/admin/delivery", label: "Livraison" },
  { href: "/admin/opening-hours", label: "Horaires" },
  { href: "/admin/payments", label: "Paiements" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/admin/settings", label: "Réglages" },
  { href: "/admin/profile", label: "Profil" },
] as const;

type Props = {
  children: React.ReactNode;
  adminName: string;
  adminEmail: string;
};

export function AdminShell({ children, adminName, adminEmail }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Login is a full-bleed page — never wrap it in the dashboard chrome.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={`rounded-sm px-3 py-2 text-[0.78rem] tracking-wide transition-colors ${
            isActive(item.href, "exact" in item && item.exact)
              ? "bg-[#c4a35a]/15 text-[#e0c878]"
              : "text-[#c4bbaa] hover:bg-white/5 hover:text-[#f0e6c8]"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const accountBlock = (
    <div className="border-t border-[#c4a35a]/20 p-4 text-xs text-[#a89f8e]">
      <p className="text-[#f0e6c8]">{adminName}</p>
      <p className="truncate">{adminEmail}</p>
      <AdminLogoutButton variant="link" className="mt-3 text-sm" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0908] text-[#f7f2e8]">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-[#c4a35a]/20 bg-[#12100e] lg:flex">
          <div className="border-b border-[#c4a35a]/20 px-4 py-5">
            <p className="font-[family-name:var(--font-display)] text-xl text-[#e0c878]">
              Sushi D&apos;or
            </p>
            <p className="mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-[#a89f8e]">
              Back-office
            </p>
          </div>
          {nav}
          {accountBlock}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#c4a35a]/20 bg-[#0a0908]/95 px-4 py-3 backdrop-blur lg:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="border border-[#c4a35a]/30 px-2 py-1 text-xs text-[#c4a35a] lg:hidden"
                onClick={() => setOpen((v) => !v)}
                aria-label="Menu"
              >
                Menu
              </button>
              <p className="hidden text-sm text-[#c4bbaa] sm:block">
                Gestion du restaurant
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-[0.65rem] uppercase tracking-[0.14em] text-[#c4a35a]"
                target="_blank"
              >
                Voir le site
              </Link>
              <AdminLogoutButton />
            </div>
          </header>

          {open ? (
            <div className="fixed inset-0 z-30 lg:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-black/60"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
              />
              <aside className="relative flex h-full w-64 flex-col bg-[#12100e]">
                <div className="border-b border-[#c4a35a]/20 px-4 py-5">
                  <p className="font-[family-name:var(--font-display)] text-xl text-[#e0c878]">
                    Sushi D&apos;or
                  </p>
                </div>
                {nav}
                {accountBlock}
              </aside>
            </div>
          ) : null}

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
