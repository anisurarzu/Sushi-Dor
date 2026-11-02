import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function PATCH(req: Request, { params }: Params) {
  const admin = await requireAdminApi("categories.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = z
      .object({
        isActive: z.boolean().optional(),
        nameFr: z.string().min(1).optional(),
        sortOrder: z.number().int().optional(),
        description: z.string().nullable().optional(),
        updateSlug: z.boolean().optional(),
      })
      .parse(await req.json());

    const data: {
      isActive?: boolean;
      nameFr?: string;
      sortOrder?: number;
      description?: string | null;
      slug?: string;
    } = {};

    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.nameFr !== undefined) data.nameFr = body.nameFr.trim();
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
    if (body.description !== undefined) {
      data.description = body.description?.trim() || null;
    }
    if (body.updateSlug && data.nameFr) {
      const base = slugify(data.nameFr) || "categorie";
      let slug = base;
      let n = 2;
      while (
        await prisma.category.findFirst({
          where: { slug, NOT: { id } },
          select: { id: true },
        })
      ) {
        slug = `${base}-${n++}`;
      }
      data.slug = slug;
    }

    const category = await prisma.category.update({ where: { id }, data });
    await writeAudit({
      userId: admin.id,
      action: "category.update",
      entity: "Category",
      entityId: id,
      meta: body,
    });
    return NextResponse.json({ category });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Mise à jour de la catégorie impossible." },
      { status: 400 },
    );
  }
}
