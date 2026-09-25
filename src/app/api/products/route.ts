import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          slug: true,
          nameFr: true,
          description: true,
          priceCents: true,
          imageUrl: true,
          isFeatured: true,
          addonGroups: {
            where: { isActive: true, required: true },
            select: { id: true },
          },
        },
      },
    },
  });

  const payload = categories.map((c) => ({
    ...c,
    products: c.products.map((p) => ({
      id: p.id,
      slug: p.slug,
      nameFr: p.nameFr,
      description: p.description,
      priceCents: p.priceCents,
      imageUrl: p.imageUrl,
      isFeatured: p.isFeatured,
      requiresCustomization: p.addonGroups.length > 0,
    })),
  }));

  return NextResponse.json({ categories: payload });
}
