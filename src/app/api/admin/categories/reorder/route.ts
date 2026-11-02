import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/soft-delete";

export async function PATCH(req: Request) {
  const admin = await requireAdminApi("categories.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = z
      .object({ orderedIds: z.array(z.string().min(1)).min(1) })
      .parse(await req.json());

    const existing = await prisma.category.findMany({
      where: { id: { in: body.orderedIds }, ...notDeleted },
      select: { id: true },
    });
    if (existing.length !== body.orderedIds.length) {
      return NextResponse.json(
        { error: "Une ou plusieurs catégories sont introuvables." },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      body.orderedIds.map((id, index) =>
        prisma.category.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    await writeAudit({
      userId: admin.id,
      action: "category.reorder",
      entity: "Category",
      meta: { orderedIds: body.orderedIds },
    });

    const categories = await prisma.category.findMany({
      where: notDeleted,
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        nameFr: true,
        slug: true,
        description: true,
        sortOrder: true,
        isActive: true,
      },
    });

    return NextResponse.json({ categories });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Réordonnancement impossible." },
      { status: 400 },
    );
  }
}
