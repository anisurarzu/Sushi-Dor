import { NextResponse } from "next/server";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  deleteProductImageFile,
  saveProductImageFile,
} from "@/lib/product-images";

type Params = { params: Promise<{ id: string; imageId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const admin = await requireAdminApi("products.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id, imageId } = await params;
  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId: id },
  });
  if (!image) {
    return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
  }

  await prisma.productImage.delete({ where: { id: imageId } });
  await deleteProductImageFile(image.url);

  const remaining = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: { displayOrder: "asc" },
  });
  await prisma.$transaction(
    remaining.map((img, index) =>
      prisma.productImage.update({
        where: { id: img.id },
        data: { displayOrder: index },
      }),
    ),
  );

  const primary = remaining[0];
  await prisma.product.update({
    where: { id },
    data: { imageUrl: primary?.url ?? null },
  });

  await writeAudit({
    userId: admin.id,
    action: "product.image_delete",
    entity: "Product",
    entityId: id,
    meta: { imageId, url: image.url },
  });

  return NextResponse.json({
    ok: true,
    images: await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { displayOrder: "asc" },
    }),
  });
}

export async function PUT(req: Request, { params }: Params) {
  const admin = await requireAdminApi("products.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id, imageId } = await params;
  const existing = await prisma.productImage.findFirst({
    where: { id: imageId, productId: id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  try {
    const { url } = await saveProductImageFile(file, id);
    await deleteProductImageFile(existing.url);
    const updated = await prisma.productImage.update({
      where: { id: imageId },
      data: { url },
    });
    if (existing.displayOrder === 0) {
      await prisma.product.update({
        where: { id },
        data: { imageUrl: url },
      });
    }
    await writeAudit({
      userId: admin.id,
      action: "product.image_replace",
      entity: "Product",
      entityId: id,
      meta: { imageId, url },
    });
    return NextResponse.json({ ok: true, image: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Remplacement échoué";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
