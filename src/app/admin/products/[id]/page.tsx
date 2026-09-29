import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";
import { AdminAddonEditor } from "@/components/admin/AdminAddonEditor";
import { AdminProductFlags } from "@/components/admin/AdminProductFlags";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { ProductDuplicateButton } from "@/components/admin/ProductDuplicateButton";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminProductPage({ params }: Props) {
  await requireAdmin("products.edit");
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        addonGroups: {
          orderBy: { displayOrder: "asc" },
          include: { addons: { orderBy: { displayOrder: "asc" } } },
        },
        images: { orderBy: { displayOrder: "asc" } },
        _count: { select: { orderItems: true } },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/products" className="text-sm text-[#c4a35a]">
        ← Produits
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">
            {product.nameFr}
          </h1>
          <p className="mt-2 text-[#a89f8e]">
            Prix de base {formatEuro(product.priceCents)}
            {product.isFeatured ? " · Incontournable" : ""}
            {product._count.orderItems > 0
              ? ` · ${product._count.orderItems} commande(s)`
              : ""}
          </p>
        </div>
        <ProductDuplicateButton productId={product.id} />
      </div>
      <ProductEditor
        categories={categories.map((c) => ({ id: c.id, nameFr: c.nameFr }))}
        initial={{
          id: product.id,
          nameFr: product.nameFr,
          slug: product.slug,
          categoryId: product.categoryId,
          shortDescription: product.shortDescription,
          description: product.description,
          priceCents: product.priceCents,
          isFeatured: product.isFeatured,
          isAvailable: product.isAvailable,
          sortOrder: product.sortOrder,
        }}
        initialImages={product.images.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          displayOrder: img.displayOrder,
        }))}
      />
      <AdminProductFlags
        productId={product.id}
        initial={{
          isFeatured: product.isFeatured,
          featuredOrder: product.featuredOrder,
          isNew: product.isNew,
          isPopular: product.isPopular,
          isVegetarian: product.isVegetarian,
          isVegan: product.isVegan,
          isSpicy: product.isSpicy,
          shortDescription: product.shortDescription,
          isAvailable: product.isAvailable,
        }}
      />
      <AdminAddonEditor
        productId={product.id}
        initialGroups={product.addonGroups.map((g) => ({
          id: g.id,
          nameFr: g.nameFr,
          selectionType: g.selectionType,
          required: g.required,
          minSelections: g.minSelections,
          maxSelections: g.maxSelections,
          isActive: g.isActive,
          addons: g.addons.map((a) => ({
            id: a.id,
            nameFr: a.nameFr,
            priceCents: a.priceCents,
            isActive: a.isActive,
          })),
        }))}
      />
    </main>
  );
}
