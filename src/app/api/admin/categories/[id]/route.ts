import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const admin = await requireAdminApi("categories.edit");
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const body = z
    .object({
      isActive: z.boolean().optional(),
      nameFr: z.string().min(1).optional(),
      sortOrder: z.number().int().optional(),
      description: z.string().nullable().optional(),
    })
    .parse(await req.json());
  const category = await prisma.category.update({ where: { id }, data: body });
  await writeAudit({
    userId: admin.id,
    action: "category.update",
    entity: "Category",
    entityId: id,
    meta: body,
  });
  return NextResponse.json({ category });
}
