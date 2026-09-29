import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  nameFr: z.string().min(1).max(120).optional(),
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  categoryId: z.string().min(1).optional(),
  shortDescription: z.string().max(180).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  priceCents: z.number().int().min(0).optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  isFeatured: z.boolean().optional(),
  featuredOrder: z.number().int().min(0).optional(),
  isNew: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isSpicy: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const admin = await requireAdminApi("products.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const body = patchSchema.parse(await req.json());
  const product = await prisma.product.update({
    where: { id },
    data: body,
  });
  await writeAudit({
    userId: admin.id,
    action: "product.update",
    entity: "Product",
    entityId: id,
    meta: body,
  });
  return NextResponse.json({ ok: true, product });
}

export async function DELETE(_req: Request, { params }: Params) {
  const admin = await requireAdminApi("products.archive");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const used = await prisma.orderItem.count({ where: { productId: id } });
  if (used > 0) {
    const product = await prisma.product.update({
      where: { id },
      data: { isAvailable: false },
    });
    await writeAudit({
      userId: admin.id,
      action: "product.archive",
      entity: "Product",
      entityId: id,
    });
    return NextResponse.json({
      ok: true,
      archived: true,
      product,
      message: "Produit archivé (référencé dans des commandes).",
    });
  }
  await prisma.product.delete({ where: { id } });
  await writeAudit({
    userId: admin.id,
    action: "product.delete",
    entity: "Product",
    entityId: id,
  });
  return NextResponse.json({ ok: true, deleted: true });
}
