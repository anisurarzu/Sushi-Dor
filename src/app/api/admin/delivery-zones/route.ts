import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const admin = await requireAdminApi("delivery.edit");
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = z
    .object({
      restaurantId: z.string(),
      name: z.string().min(1),
      postalCodes: z.array(z.string().min(4)).min(1),
      feeCents: z.number().int().min(0),
      minOrderCents: z.number().int().min(0),
    })
    .parse(await req.json());
  const zone = await prisma.deliveryZone.create({
    data: { ...body, isActive: true },
  });
  await writeAudit({
    userId: admin.id,
    action: "delivery_zone.create",
    entity: "DeliveryZone",
    entityId: zone.id,
  });
  return NextResponse.json({ zone });
}
