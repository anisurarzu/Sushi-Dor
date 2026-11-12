import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { CATEGORY_ADDON_ADMIN_FREE_MIN } from "@/lib/category-addons";
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
        isFree: a.isFree,
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
        items: z
          .array(
            z.object({
              productId: z.string().min(1),
              isFree: z.boolean().default(false),
            }),
          )
          .max(120),
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

    const seen = new Set<string>();
    const ordered = body.items.filter((item) => {
      if (seen.has(item.productId)) return false;
      seen.add(item.productId);
      return true;
    });

    const valid = await prisma.product.findMany({
      where: {
        id: { in: ordered.map((i) => i.productId) },
        ...notDeleted,
      },
      select: { id: true },
    });
    const validIds = new Set(valid.map((p) => p.id));
    const finalItems = ordered.filter((i) => validIds.has(i.productId));
    const allowAdminFree = finalItems.length >= CATEGORY_ADDON_ADMIN_FREE_MIN;

    await prisma.$transaction(async (tx) => {
      await tx.categoryAddonProduct.deleteMany({ where: { categoryId: id } });
      if (finalItems.length > 0) {
        await tx.categoryAddonProduct.createMany({
          data: finalItems.map((item, sortOrder) => ({
            categoryId: id,
            productId: item.productId,
            sortOrder,
            isActive: true,
            isFree: allowAdminFree ? item.isFree : false,
          })),
        });
      }
    });

    await writeAudit({
      userId: admin.id,
      action: "category.addons.update",
      entity: "Category",
      entityId: id,
      meta: { items: finalItems },
    });

    return NextResponse.json({
      ok: true,
      productIds: finalItems.map((i) => i.productId),
    });
  } catch (err) {
    console.error("[admin/categories/addons PUT]", err);
    const message =
      err instanceof Error && /Unknown argument `isFree`/i.test(err.message)
        ? "Schéma Prisma obsolète — redémarrez le serveur (npm run dev)."
        : err instanceof Error && "issues" in err
          ? "Données invalides."
          : "Mise à jour des addons impossible.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
