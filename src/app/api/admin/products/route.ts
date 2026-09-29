import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const productSchema = z.object({
  nameFr: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  categoryId: z.string().min(1),
  shortDescription: z.string().max(180).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  priceCents: z.number().int().min(0),
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

export async function POST(req: Request) {
  const admin = await requireAdminApi("products.create");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = productSchema.parse(await req.json());
  const product = await prisma.product.create({ data: body });
  await writeAudit({
    userId: admin.id,
    action: "product.create",
    entity: "Product",
    entityId: product.id,
  });
  return NextResponse.json({ product });
}
