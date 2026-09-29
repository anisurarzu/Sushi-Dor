import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { saveProductImageFile } from "@/lib/product-images";

const MAX_IMAGES = 3;

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const admin = await requireAdminApi("products.view");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const images = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json({ images });
}

export async function POST(req: Request, { params }: Params) {
  const admin = await requireAdminApi("products.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const alt = String(form.get("alt") || "").slice(0, 200) || null;
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  try {
    const image = await prisma.$transaction(async (tx) => {
      const count = await tx.productImage.count({ where: { productId: id } });
      if (count >= MAX_IMAGES) {
        throw new Error("Maximum 3 images par produit.");
      }
      const { url } = await saveProductImageFile(file, id);
      const created = await tx.productImage.create({
        data: {
          productId: id,
          url,
          alt,
          displayOrder: count,
        },
      });
      if (count === 0) {
        await tx.product.update({
          where: { id },
          data: { imageUrl: url },
        });
      }
      return created;
    });

    await writeAudit({
      userId: admin.id,
      action: "product.image_upload",
      entity: "Product",
      entityId: id,
      meta: { imageId: image.id, url: image.url },
    });

    return NextResponse.json({ ok: true, image });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload échoué";
    const status = message.includes("Maximum") ? 400 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1).max(3),
});

export async function PATCH(req: Request, { params }: Params) {
  const admin = await requireAdminApi("products.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const body = reorderSchema.parse(await req.json());

  const images = await prisma.productImage.findMany({
    where: { productId: id },
  });
  if (images.length !== body.orderedIds.length) {
    return NextResponse.json({ error: "Liste invalide" }, { status: 400 });
  }
  const idSet = new Set(images.map((i) => i.id));
  if (!body.orderedIds.every((x) => idSet.has(x))) {
    return NextResponse.json({ error: "IDs invalides" }, { status: 400 });
  }

  await prisma.$transaction(
    body.orderedIds.map((imageId, index) =>
      prisma.productImage.update({
        where: { id: imageId },
        data: { displayOrder: index },
      }),
    ),
  );

  const primary = await prisma.productImage.findFirst({
    where: { productId: id },
    orderBy: { displayOrder: "asc" },
  });
  if (primary) {
    await prisma.product.update({
      where: { id },
      data: { imageUrl: primary.url },
    });
  }

  await writeAudit({
    userId: admin.id,
    action: "product.image_reorder",
    entity: "Product",
    entityId: id,
    meta: { orderedIds: body.orderedIds },
  });

  const updated = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json({ ok: true, images: updated });
}
