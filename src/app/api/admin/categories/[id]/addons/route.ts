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

  try {
    const { id } = await params;
    const category = await prisma.category.findFirst({
      where: { id, ...notDeleted },
      select: { id: true, nameFr: true },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Catégorie introuvable." },
        { status: 404 },
      );
    }

    const [allProducts, addons] = await Promise.all([
      prisma.product.findMany({
        where: { ...notDeleted },
        orderBy: [{ nameFr: "asc" }],
        select: {
          id: true,
          nameFr: true,
          priceCents: true,
          imageUrl: true,
          isAvailable: true,
          category: { select: { nameFr: true } },
          addonGroups: {
            where: { isActive: true, required: true },
            select: { id: true },
          },
        },
      }),
      prisma.categoryAddonProduct.findMany({
        where: { categoryId: id, isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            select: {
              id: true,
              nameFr: true,
              priceCents: true,
              imageUrl: true,
              isAvailable: true,
              deletedStatus: true,
              category: { select: { nameFr: true } },
            },
          },
        },
      }),
    ]);

    const products = allProducts.map((p) => ({
      id: p.id,
      nameFr: p.nameFr,
      priceCents: p.priceCents,
      imageUrl: p.imageUrl,
      isAvailable: p.isAvailable,
      categoryNameFr: p.category.nameFr,
      requiresCustomization: p.addonGroups.length > 0,
    }));

    const selected = addons
      .filter((a) => a.product && a.product.deletedStatus !== 255)
      .map((a) => ({
        id: a.product.id,
        nameFr: a.product.nameFr,
        priceCents: a.product.priceCents,
        imageUrl: a.product.imageUrl,
        isAvailable: a.product.isAvailable,
        categoryNameFr: a.product.category.nameFr,
        requiresCustomization: false,
      }));

    return NextResponse.json({
      category,
      products,
      selected,
      selectedProductIds: selected.map((p) => p.id),
    });
  } catch (err) {
    console.error("[admin/categories/addons GET]", err);
    return NextResponse.json(
      { error: "Chargement des addons impossible." },
      { status: 500 },
    );
  }
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
        productIds: z.array(z.string().min(1)).max(120),
      })
      .parse(await req.json());

    const category = await prisma.category.findFirst({
      where: { id, ...notDeleted },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Catégorie introuvable." },
        { status: 404 },
      );
    }

    const uniqueIds = [...new Set(body.productIds)];
    const valid = await prisma.product.findMany({
      where: {
        id: { in: uniqueIds },
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
    console.error("[admin/categories/addons PUT]", err);
    return NextResponse.json(
      { error: "Mise à jour des addons impossible." },
      { status: 400 },
    );
  }
}
