import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/soft-delete";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdmin("categories.view");
  const categories = await prisma.category.findMany({
    where: notDeleted,
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: { where: notDeleted } } },
    },
  });
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#c4a35a]">
          Catalogue
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl">
          Catégories
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#a89f8e]">
          Cliquez sur <span className="text-[#e0c878]">Modifier</span> (ou sur le
          nom) pour éditer. Glissez ⋮⋮ ou utilisez ↑ ↓ pour l&apos;ordre du site.
        </p>
      </div>
      <CategoryManager
        initial={categories.map((c) => ({
          id: c.id,
          nameFr: c.nameFr,
          slug: c.slug,
          description: c.description,
          sortOrder: c.sortOrder,
          isActive: c.isActive,
          productCount: c._count.products,
        }))}
      />
      <Link href="/admin/products" className="text-sm text-[#c4a35a]">Voir les produits →</Link>
    </div>
  );
}
