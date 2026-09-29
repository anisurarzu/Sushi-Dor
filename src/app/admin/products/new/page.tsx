import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage() {
  await requireAdmin("products.create");
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/products" className="text-sm text-[#c4a35a]">
          ← Produits
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
          Nouveau produit
        </h1>
        <p className="mt-1 text-sm text-[#a89f8e]">
          Ajoutez jusqu&apos;à 3 images par upload (pas d&apos;URL).
        </p>
      </div>
      <ProductEditor
        categories={categories.map((c) => ({
          id: c.id,
          nameFr: c.nameFr,
        }))}
      />
    </div>
  );
}
