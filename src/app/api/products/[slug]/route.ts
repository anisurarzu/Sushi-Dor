import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      addonGroups: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        include: {
          addons: {
            where: { isActive: true },
            orderBy: { displayOrder: "asc" },
            include: {
              allergens: { include: { allergen: true } },
            },
          },
        },
      },
    },
  });

  if (!product || !product.isAvailable) {
    return NextResponse.json(
      { error: "Produit introuvable ou indisponible." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    product: {
      id: product.id,
      slug: product.slug,
      nameFr: product.nameFr,
      description: product.description,
      priceCents: product.priceCents,
      imageUrl: product.imageUrl,
      category: product.category,
      requiresCustomization: product.addonGroups.some((g) => g.required),
      addonGroups: product.addonGroups.map((g) => ({
        id: g.id,
        nameFr: g.nameFr,
        description: g.description,
        selectionType: g.selectionType,
        required: g.required,
        minSelections: g.minSelections,
        maxSelections: g.maxSelections,
        addons: g.addons.map((a) => ({
          id: a.id,
          nameFr: a.nameFr,
          description: a.description,
          priceCents: a.priceCents,
          allergens: a.allergens.map((x) => x.allergen.nameFr),
        })),
      })),
    },
  });
}
