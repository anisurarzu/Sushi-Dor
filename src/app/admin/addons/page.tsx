import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminAddonsPage() {
  await requireAdmin("ADMIN");
  const groups = await prisma.productAddonGroup.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      product: { select: { id: true, nameFr: true } },
      addons: { orderBy: { displayOrder: "asc" } },
    },
    take: 100,
  });
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#c4a35a]">Catalogue</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl">Options / add-ons</h1>
      </div>
      {groups.length === 0 ? (
        <p className="border border-[#c4a35a]/20 p-6 text-sm text-[#a89f8e]">Aucun groupe d&apos;options.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <article key={g.id} className="border border-[#c4a35a]/20 bg-[#12100e] p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h2 className="text-[#f0e6c8]">{g.nameFr}</h2>
                  <p className="text-xs text-[#a89f8e]">
                    {g.product.nameFr} · {g.selectionType} · {g.required ? "obligatoire" : "optionnel"}
                  </p>
                </div>
                <Link href={`/admin/products/${g.product.id}`} className="text-xs text-[#c4a35a]">
                  Éditer produit
                </Link>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-[#c4bbaa]">
                {g.addons.map((a) => (
                  <li key={a.id}>
                    {a.nameFr} — {(a.priceCents / 100).toFixed(2)} € {a.isActive ? "" : "(off)"}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
