import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const admin = await requireAdminApi("delivery.edit");
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const body = z
    .object({
      isActive: z.boolean().optional(),
      feeCents: z.number().int().min(0).optional(),
      minOrderCents: z.number().int().min(0).optional(),
      postalCodes: z.array(z.string()).optional(),
      name: z.string().min(1).optional(),
    })
    .parse(await req.json());
  const zone = await prisma.deliveryZone.update({ where: { id }, data: body });
  await writeAudit({
    userId: admin.id,
    action: "delivery_zone.update",
    entity: "DeliveryZone",
    entityId: id,
  });
  return NextResponse.json({ zone });
}
