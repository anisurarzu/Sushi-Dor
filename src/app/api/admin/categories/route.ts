import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: Request) {
  const admin = await requireAdminApi("categories.edit");
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = z.object({ nameFr: z.string().min(1) }).parse(await req.json());
  const max = await prisma.category.aggregate({ _max: { sortOrder: true } });
  const category = await prisma.category.create({
    data: {
      nameFr: body.nameFr,
      slug: slugify(body.nameFr),
      sortOrder: (max._max.sortOrder ?? 0) + 1,
      isActive: true,
    },
  });
  await writeAudit({
    userId: admin.id,
    action: "category.create",
    entity: "Category",
    entityId: category.id,
  });
  return NextResponse.json({ category });
}
