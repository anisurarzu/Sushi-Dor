import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/soft-delete";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const admin = await requireAdminApi("categories.view");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const category = await prisma.category.findFirst({
    where: { id, ...notDeleted },
    select: { id: true, nameFr: true },
  });
  if (!category) {
    return NextResponse.json({ error: "Catégorie introuvable." }, { status: 404 });
  }

  const [products, addons] = await Promise.all([
    prisma.product.findMany({
      where: { categoryId: id, ...notDeleted },
      orderBy: [{ sortOrder: "asc" }, { nameFr: "asc" }],
      select: {
        id: true,
        nameFr: true,
        priceCents: true,
        imageUrl: true,
        isAvailable: true,
        addonGroups: {
          where: { isActive: true, required: true },
          select: { id: true },
        },
      },
    }),
    prisma.categoryAddonProduct.findMany({
      where: { categoryId: id },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        productId: true,
        sortOrder: true,
        isActive: true,
      },
    }),
  ]);

  return NextResponse.json({
    category,
    products: products.map((p) => ({
      id: p.id,
      nameFr: p.nameFr,
      priceCents: p.priceCents,
      imageUrl: p.imageUrl,
      isAvailable: p.isAvailable,
      requiresCustomization: p.addonGroups.length > 0,
    })),
    selectedProductIds: addons.filter((a) => a.isActive).map((a) => a.productId),
    addons,
  });
}

export async function PUT(req: Request, { params }: Params) {
  const admin = await requireAdminApi("categories.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = z
      .object({
        productIds: z.array(z.string().min(1)).max(80),
      })
      .parse(await req.json());

    const category = await prisma.category.findFirst({
      where: { id, ...notDeleted },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json({ error: "Catégorie introuvable." }, { status: 404 });
    }

    const uniqueIds = [...new Set(body.productIds)];
    const valid = await prisma.product.findMany({
      where: {
        id: { in: uniqueIds },
        categoryId: id,
        ...notDeleted,
      },
      select: { id: true },
    });
    const validIds = new Set(valid.map((p) => p.id));
    const ordered = uniqueIds.filter((pid) => validIds.has(pid));

    await prisma.$transaction(async (tx) => {
      await tx.categoryAddonProduct.deleteMany({ where: { categoryId: id } });
      if (ordered.length > 0) {
        await tx.categoryAddonProduct.createMany({
          data: ordered.map((productId, sortOrder) => ({
            categoryId: id,
            productId,
            sortOrder,
            isActive: true,
          })),
        });
      }
    });

    await writeAudit({
      userId: admin.id,
      action: "category.addons.update",
      entity: "Category",
      entityId: id,
      meta: { productIds: ordered },
    });

    return NextResponse.json({ ok: true, productIds: ordered });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Mise à jour des addons impossible." },
      { status: 400 },
    );
  }
}
