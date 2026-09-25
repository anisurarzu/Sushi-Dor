import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const jar = await cookies();
  const token = jar.get("sd_admin")?.value;
  if (!token) redirect("/admin/login");
  const session = await prisma.session.findUnique({
    where: { tokenHash: token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }
  return session.user;
}

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await prisma.product.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      addonGroups: { include: { addons: true } },
      category: true,
    },
  });

  return (
    <main className="min-h-screen bg-ink px-4 py-10 text-bone md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-[family-name:var(--font-display)] text-3xl">
            Admin · Produits & options
          </h1>
          <Link href="/admin/orders" className="text-sm text-gold">
            Commandes
          </Link>
        </div>
        <div className="mt-8 space-y-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="border border-[color:var(--line)] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg text-champagne">{p.nameFr}</h2>
                  <p className="text-sm text-mist">
                    {p.category.nameFr} · {formatEuro(p.priceCents)} ·{" "}
                    {p.isAvailable ? "Disponible" : "Indisponible"}
                  </p>
                </div>
                <Link
                  href={`/admin/products/${p.id}`}
                  className="text-[0.68rem] uppercase tracking-[0.14em] text-gold"
                >
                  Gérer les options
                </Link>
              </div>
              {p.addonGroups.length > 0 ? (
                <ul className="mt-3 space-y-1 text-sm text-mist">
                  {p.addonGroups.map((g) => (
                    <li key={g.id}>
                      {g.nameFr} — {g.selectionType}{" "}
                      {g.required ? "(obligatoire)" : "(optionnel)"} ·{" "}
                      {g.addons.length} option(s)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-mist">Aucune option</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
