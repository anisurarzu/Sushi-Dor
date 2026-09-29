import { NextResponse } from "next/server";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const admin = await requireAdminApi("products.create");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const source = await prisma.product.findUnique({
    where: { id },
    include: {
      addonGroups: { include: { addons: true } },
      images: { orderBy: { displayOrder: "asc" } },
    },
  });
  if (!source) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  let slug = `${source.slug}-copy`;
  let n = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${source.slug}-copy-${n}`;
  }

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        slug,
        nameFr: `${source.nameFr} Copy`,
        description: source.description,
        shortDescription: source.shortDescription,
        priceCents: source.priceCents,
        imageUrl: source.images[0]?.url || source.imageUrl,
        categoryId: source.categoryId,
        isFeatured: false,
        isAvailable: false,
        isNew: source.isNew,
        isPopular: source.isPopular,
        isVegetarian: source.isVegetarian,
        isVegan: source.isVegan,
        isSpicy: source.isSpicy,
        sortOrder: source.sortOrder,
        pieces: source.pieces,
      },
    });

    for (const img of source.images) {
      await tx.productImage.create({
        data: {
          productId: created.id,
          url: img.url,
          alt: img.alt,
          displayOrder: img.displayOrder,
        },
      });
    }

    for (const group of source.addonGroups) {
      await tx.productAddonGroup.create({
        data: {
          productId: created.id,
          nameFr: group.nameFr,
          description: group.description,
          selectionType: group.selectionType,
          required: group.required,
          minSelections: group.minSelections,
          maxSelections: group.maxSelections,
          displayOrder: group.displayOrder,
          isActive: group.isActive,
          addons: {
            create: group.addons.map((a) => ({
              nameFr: a.nameFr,
              description: a.description,
              priceCents: a.priceCents,
              imageUrl: a.imageUrl,
              isActive: a.isActive,
              displayOrder: a.displayOrder,
            })),
          },
        },
      });
    }

    return created;
  });

  await writeAudit({
    userId: admin.id,
    action: "product.duplicate",
    entity: "Product",
    entityId: product.id,
    meta: { sourceId: id },
  });

  return NextResponse.json({ ok: true, product });
}
