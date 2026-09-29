import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdmin("ADMIN");
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#c4a35a]">Catalogue</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl">Catégories</h1>
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
