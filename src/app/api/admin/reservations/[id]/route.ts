import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendReservationEmail } from "@/lib/reservations";

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
  occasion: z.string().max(80).nullable().optional(),
  adminNotes: z.string().max(1000).nullable().optional(),
  source: z.enum(["ONLINE", "PHONE", "WALK_IN", "OTHER"]).optional(),
  status: z
    .enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"])
    .optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const body = schema.parse(await req.json());
  const needsCancel =
    body.status === "CANCELLED"
      ? await requireAdminApi("reservations.cancel")
      : null;
  const admin =
    needsCancel ||
    (await requireAdminApi(
      body.status ? "reservations.edit" : "reservations.edit",
    ));
  if (!admin) {
    // Try cancel permission path already checked; fallback edit
    const editAdmin = await requireAdminApi("reservations.edit");
    if (!editAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }
  const actor = admin || (await requireAdminApi("reservations.edit"));
  if (!actor) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.reservation.findUnique({
    where: { id },
    include: { restaurant: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  if (body.status === "CANCELLED") {
    const canCancel = await requireAdminApi("reservations.cancel");
    if (!canCancel && existing.status !== "CANCELLED") {
      // Allow edit permission holders to cancel in ops practice
      const canEdit = await requireAdminApi("reservations.edit");
      if (!canEdit) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
    }
  }

  const restaurantId = body.restaurantId || existing.restaurantId;
  const date = body.date ? new Date(`${body.date}T00:00:00.000Z`) : existing.date;
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
        deletedStatus: 0,
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
      date: body.date ? new Date(`${body.date}T00:00:00.000Z`) : undefined,
    },
    include: { restaurant: true },
  });

  if (
    body.status &&
    body.status !== existing.status &&
    (body.status === "CONFIRMED" || body.status === "CANCELLED")
  ) {
    void sendReservationEmail({
      reservation,
      restaurantName: reservation.restaurant.name,
      restaurantPhone: reservation.restaurant.phone,
      kind: body.status === "CANCELLED" ? "cancelled" : "confirmation",
    });
  }

  await writeAudit({
    userId: actor.id,
    action: "reservation.update",
    entity: "Reservation",
    entityId: id,
    meta: body,
  });

  return NextResponse.json({ ok: true, reservation });
}
