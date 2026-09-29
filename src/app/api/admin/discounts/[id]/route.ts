import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  code: z.string().min(2).max(40).optional(),
  description: z.string().max(200).nullable().optional(),
  percentOff: z.number().int().min(1).max(100).nullable().optional(),
  amountOffCents: z.number().int().min(1).nullable().optional(),
  minOrderCents: z.number().int().min(0).optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const admin = await requireAdminApi("discounts.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const body = schema.parse(await req.json());
  const discount = await prisma.discount.update({
    where: { id },
    data: {
      ...body,
      code: body.code ? body.code.toUpperCase().trim() : undefined,
      startsAt:
        body.startsAt === undefined
          ? undefined
          : body.startsAt
            ? new Date(body.startsAt)
            : null,
      endsAt:
        body.endsAt === undefined
          ? undefined
          : body.endsAt
            ? new Date(body.endsAt)
            : null,
    },
  });
  await writeAudit({
    userId: admin.id,
    action: "discount.update",
    entity: "Discount",
    entityId: id,
    meta: body,
  });
  return NextResponse.json({ ok: true, discount });
}

export async function DELETE(_req: Request, { params }: Params) {
  const admin = await requireAdminApi("discounts.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const discount = await prisma.discount.update({
    where: { id },
    data: { isActive: false },
  });
  await writeAudit({
    userId: admin.id,
    action: "discount.archive",
    entity: "Discount",
    entityId: id,
  });
  return NextResponse.json({ ok: true, discount });
}
