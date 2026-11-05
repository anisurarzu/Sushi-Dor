import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import {
  computeEndTime,
  createReservation,
  sendReservationEmail,
} from "@/lib/reservations";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  restaurantId: z.string().min(1),
  date: z.string(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  partySize: z.number().int().min(1).max(40),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().min(6).max(40),
  specialRequest: z.string().max(500).nullable().optional(),
  occasion: z.string().max(80).nullable().optional(),
  adminNotes: z.string().max(1000).nullable().optional(),
  source: z.enum(["ONLINE", "PHONE", "WALK_IN", "OTHER"]).optional(),
  status: z
    .enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"])
    .optional(),
});

export async function POST(req: Request) {
  const admin = await requireAdminApi("reservations.create");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const body = schema.parse(await req.json());
    const { reservation, cancelToken } = await createReservation({
      restaurantId: body.restaurantId,
      date: body.date,
      startTime: body.startTime,
      partySize: body.partySize,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      specialRequest: body.specialRequest,
      occasion: body.occasion,
      adminNotes: body.adminNotes,
      source: body.source || "PHONE",
      status: body.status || "CONFIRMED",
      asAdmin: true,
    });

    // Allow admin override of endTime if provided
    let finalReservation = reservation;
    if (body.endTime && body.endTime !== reservation.endTime) {
      finalReservation = await prisma.reservation.update({
        where: { id: reservation.id },
        data: { endTime: body.endTime || computeEndTime(body.startTime, body.partySize) },
      });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: finalReservation.restaurantId },
    });
    if (finalReservation.status === "CONFIRMED" || finalReservation.status === "PENDING") {
      void sendReservationEmail({
        reservation: finalReservation,
        restaurantName: restaurant?.name || "Sushi D'or",
        restaurantPhone: restaurant?.phone,
        cancelToken,
        kind: finalReservation.status === "PENDING" ? "pending" : "confirmation",
      });
    }

    await writeAudit({
      userId: admin.id,
      action: "reservation.create",
      entity: "Reservation",
      entityId: finalReservation.id,
      meta: { source: finalReservation.source },
    });

    return NextResponse.json({ ok: true, reservation: finalReservation, cancelToken });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Données invalides" },
        { status: 400 },
      );
    }
    const message =
      err instanceof Error ? err.message : "Création impossible.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
