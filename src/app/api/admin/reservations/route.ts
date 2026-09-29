import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  restaurantId: z.string().min(1),
  date: z.string(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.number().int().min(1).max(40),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().min(6).max(40),
  specialRequest: z.string().max(500).nullable().optional(),
  status: z
    .enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"])
    .optional(),
});

function code() {
  return `SD${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function POST(req: Request) {
  const admin = await requireAdminApi("reservations.create");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = schema.parse(await req.json());
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: body.restaurantId },
  });
  if (!restaurant || !restaurant.reservationEnabled) {
    return NextResponse.json(
      { error: "Réservations non disponibles." },
      { status: 400 },
    );
  }

  const date = new Date(body.date);
  const blocked = await prisma.blockedDate.findUnique({
    where: {
      restaurantId_date: { restaurantId: body.restaurantId, date },
    },
  });
  if (blocked) {
    return NextResponse.json(
      { error: "Date bloquée / fermée." },
      { status: 400 },
    );
  }

  const overlapping = await prisma.reservation.count({
    where: {
      restaurantId: body.restaurantId,
      date,
      status: { in: ["PENDING", "CONFIRMED"] },
      startTime: { lt: body.endTime },
      endTime: { gt: body.startTime },
    },
  });
  // Soft capacity: party size sum approx via count * avg — use guest sum
  const guests = await prisma.reservation.aggregate({
    where: {
      restaurantId: body.restaurantId,
      date,
      status: { in: ["PENDING", "CONFIRMED"] },
      startTime: { lt: body.endTime },
      endTime: { gt: body.startTime },
    },
    _sum: { partySize: true },
  });
  const used = guests._sum.partySize || 0;
  if (used + body.partySize > restaurant.maxGuestsPerSlot) {
    return NextResponse.json(
      { error: "Créneau complet (capacité atteinte)." },
      { status: 409 },
    );
  }

  const cancelToken = randomBytes(24).toString("hex");
  const reservation = await prisma.reservation.create({
    data: {
      confirmationCode: code(),
      cancelTokenHash: createHash("sha256").update(cancelToken).digest("hex"),
      restaurantId: body.restaurantId,
      date,
      startTime: body.startTime,
      endTime: body.endTime,
      partySize: body.partySize,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      specialRequest: body.specialRequest || null,
      status: body.status || "CONFIRMED",
    },
  });

  await writeAudit({
    userId: admin.id,
    action: "reservation.create",
    entity: "Reservation",
    entityId: reservation.id,
    meta: { overlappingHint: overlapping },
  });

  return NextResponse.json({ ok: true, reservation });
}
