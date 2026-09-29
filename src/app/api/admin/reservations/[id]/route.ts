import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  restaurantId: z.string().min(1).optional(),
  date: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  partySize: z.number().int().min(1).max(40).optional(),
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(6).max(40).optional(),
  specialRequest: z.string().max(500).nullable().optional(),
  status: z
    .enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"])
    .optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const admin = await requireAdminApi("reservations.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const body = schema.parse(await req.json());

  const restaurantId = body.restaurantId || existing.restaurantId;
  const date = body.date ? new Date(body.date) : existing.date;
  const startTime = body.startTime || existing.startTime;
  const endTime = body.endTime || existing.endTime;
  const partySize = body.partySize ?? existing.partySize;

  if (
    body.date ||
    body.startTime ||
    body.endTime ||
    body.partySize ||
    body.restaurantId
  ) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant invalide" }, { status: 400 });
    }
    const guests = await prisma.reservation.aggregate({
      where: {
        restaurantId,
        date,
        status: { in: ["PENDING", "CONFIRMED"] },
        id: { not: id },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      _sum: { partySize: true },
    });
    if ((guests._sum.partySize || 0) + partySize > restaurant.maxGuestsPerSlot) {
      return NextResponse.json(
        { error: "Créneau complet (capacité atteinte)." },
        { status: 409 },
      );
    }
  }

  const reservation = await prisma.reservation.update({
    where: { id },
    data: {
      ...body,
      date: body.date ? new Date(body.date) : undefined,
    },
  });

  await writeAudit({
    userId: admin.id,
    action: "reservation.update",
    entity: "Reservation",
    entityId: id,
    meta: body,
  });

  return NextResponse.json({ ok: true, reservation });
}
