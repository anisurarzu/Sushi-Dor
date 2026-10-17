import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/soft-delete";
import { ProductsFilters } from "@/components/admin/ProductsFilters";
import { ProductsDeleteList } from "@/components/admin/ProductsDeleteList";

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
    prisma.category.findMany({
      where: notDeleted,
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: {
        AND: [
          notDeleted,
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
      include: {
        category: true,
        images: { orderBy: { displayOrder: "asc" }, take: 1 },
      },
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

      <ProductsDeleteList
        products={products.map((p) => ({
          id: p.id,
          nameFr: p.nameFr,
          imageUrl: p.imageUrl || p.images[0]?.url || null,
          categoryName: p.category.nameFr,
          priceCents: p.priceCents,
          isAvailable: p.isAvailable,
          isFeatured: p.isFeatured,
        }))}
      />
    </div>
  );
}
