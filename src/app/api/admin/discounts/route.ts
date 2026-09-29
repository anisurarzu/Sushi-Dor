import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const schema = z
  .object({
    code: z.string().min(2).max(40),
    description: z.string().max(200).nullable().optional(),
    percentOff: z.number().int().min(1).max(100).nullable().optional(),
    amountOffCents: z.number().int().min(1).nullable().optional(),
    minOrderCents: z.number().int().min(0).default(0),
    startsAt: z.string().nullable().optional(),
    endsAt: z.string().nullable().optional(),
    maxUses: z.number().int().min(1).nullable().optional(),
    isActive: z.boolean().default(true),
  })
  .refine((d) => Boolean(d.percentOff) !== Boolean(d.amountOffCents) || d.percentOff || d.amountOffCents, {
    message: "Indiquez un pourcentage ou un montant fixe.",
  });

export async function GET() {
  const admin = await requireAdminApi("discounts.view");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const discounts = await prisma.discount.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ discounts });
}

export async function POST(req: Request) {
  const admin = await requireAdminApi("discounts.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = schema.parse(await req.json());
  const discount = await prisma.discount.create({
    data: {
      code: body.code.toUpperCase().trim(),
      description: body.description || null,
      percentOff: body.percentOff || null,
      amountOffCents: body.amountOffCents || null,
      minOrderCents: body.minOrderCents,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      maxUses: body.maxUses || null,
      isActive: body.isActive,
    },
  });
  await writeAudit({
    userId: admin.id,
    action: "discount.create",
    entity: "Discount",
    entityId: discount.id,
  });
  return NextResponse.json({ ok: true, discount });
}
