import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";
import { ProductsFilters } from "@/components/admin/ProductsFilters";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    featured?: string;
    available?: string;
  }>;
};

export default async function AdminProductsPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim() || "";

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: {
        AND: [
          q
            ? {
                OR: [
                  { nameFr: { contains: q, mode: "insensitive" } },
                  { slug: { contains: q, mode: "insensitive" } },
                ],
              }
            : {},
          sp.category ? { categoryId: sp.category } : {},
          sp.featured === "1" ? { isFeatured: true } : {},
          sp.available === "0" ? { isAvailable: false } : {},
          sp.available === "1" ? { isAvailable: true } : {},
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { nameFr: "asc" }],
      include: { category: true, _count: { select: { orderItems: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#c4a35a]">
            Catalogue
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl">
            Produits
          </h1>
        </div>
        <Link href="/admin/products/new" className="btn-gold">
          Nouveau produit
        </Link>
      </div>

      <ProductsFilters
        q={q}
        category={sp.category || ""}
        categories={categories.map((c) => ({ id: c.id, nameFr: c.nameFr }))}
      />

      {products.length === 0 ? (
        <p className="border border-[#c4a35a]/20 p-8 text-center text-sm text-[#a89f8e]">
          Aucun produit disponible.{" "}
          <Link href="/admin/products/new" className="text-[#c4a35a]">
            Créer un produit
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto border border-[#c4a35a]/20">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-[#12100e] text-[0.65rem] uppercase tracking-[0.12em] text-[#a89f8e]">
              <tr>
                <th className="px-3 py-3">Produit</th>
                <th className="px-3 py-3">Catégorie</th>
                <th className="px-3 py-3">Prix</th>
                <th className="px-3 py-3">Dispo</th>
                <th className="px-3 py-3">Featured</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-[#c4a35a]/15 hover:bg-white/[0.02]"
                >
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="text-[#e0c878]"
                    >
                      {p.nameFr}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-[#c4bbaa]">{p.category.nameFr}</td>
                  <td className="px-3 py-3">{formatEuro(p.priceCents)}</td>
                  <td className="px-3 py-3">
                    {p.isAvailable ? "Oui" : "Non"}
                  </td>
                  <td className="px-3 py-3">{p.isFeatured ? "Oui" : "—"}</td>
                  <td className="px-3 py-3 text-right">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="border border-[#c4a35a]/40 px-2.5 py-1 text-xs text-[#e0c878]"
                    >
                      Éditer
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
