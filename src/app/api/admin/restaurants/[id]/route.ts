import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  address: z.string().min(1).max(200).optional(),
  postalCode: z.string().min(4).max(12).optional(),
  city: z.string().min(1).max(100).optional(),
  phone: z.string().max(40).nullable().optional(),
  email: z.string().email().nullable().optional(),
  deliveryEnabled: z.boolean().optional(),
  pickupEnabled: z.boolean().optional(),
  reservationEnabled: z.boolean().optional(),
  isActive: z.boolean().optional(),
  deliveryFeeCents: z.number().int().min(0).optional(),
  minOrderCents: z.number().int().min(0).optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const admin = await requireAdminApi("restaurants.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const body = schema.parse(await req.json());
  const restaurant = await prisma.restaurant.update({
    where: { id },
    data: body,
  });
  await writeAudit({
    userId: admin.id,
    action: "restaurant.update",
    entity: "Restaurant",
    entityId: id,
    meta: body,
  });
  return NextResponse.json({ ok: true, restaurant });
}

export async function DELETE(_req: Request, { params }: Params) {
  const admin = await requireAdminApi("restaurants.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const orders = await prisma.order.count({ where: { restaurantId: id } });
  const reservations = await prisma.reservation.count({
    where: { restaurantId: id },
  });
  if (orders > 0 || reservations > 0) {
    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: { isActive: false },
    });
    await writeAudit({
      userId: admin.id,
      action: "restaurant.archive",
      entity: "Restaurant",
      entityId: id,
    });
    return NextResponse.json({
      ok: true,
      archived: true,
      restaurant,
      message: "Restaurant archivé (historique présent).",
    });
  }
  await prisma.restaurant.delete({ where: { id } });
  await writeAudit({
    userId: admin.id,
    action: "restaurant.delete",
    entity: "Restaurant",
    entityId: id,
  });
  return NextResponse.json({ ok: true, deleted: true });
}
