import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createReservation,
  sendReservationEmail,
} from "@/lib/reservations";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  restaurantId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.number().int().min(1).max(40),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().min(8).max(40),
  occasion: z.string().max(40).nullable().optional(),
  specialRequest: z.string().max(500).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const { reservation, cancelToken } = await createReservation({
      ...body,
      source: "ONLINE",
    });

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: reservation.restaurantId },
    });

    const kind = reservation.status === "PENDING" ? "pending" : "confirmation";
    void sendReservationEmail({
      reservation,
      restaurantName: restaurant?.name || "Sushi D'or",
      restaurantPhone: restaurant?.phone,
      cancelToken,
      kind,
    });

    // Mirror booking alert to restaurant inbox when configured
    if (restaurant?.email) {
      const { sendEmail } = await import("@/lib/email");
      void sendEmail({
        to: restaurant.email,
        subject: `[Réservation] ${reservation.confirmationCode} · ${reservation.partySize}p · ${reservation.date.toISOString().slice(0, 10)} ${reservation.startTime}`,
        html: `<p>Nouvelle réservation ${reservation.status}</p>
          <p><strong>${reservation.firstName} ${reservation.lastName}</strong> · ${reservation.partySize} convives<br/>
          ${reservation.date.toISOString().slice(0, 10)} à ${reservation.startTime}<br/>
          ${reservation.phone} · ${reservation.email}</p>
          ${reservation.specialRequest ? `<p>Note: ${reservation.specialRequest}</p>` : ""}`,
      });
    }

    return NextResponse.json({
      ok: true,
      cancelToken,
      reservation: {
        id: reservation.id,
        confirmationCode: reservation.confirmationCode,
        status: reservation.status,
        date: reservation.date.toISOString().slice(0, 10),
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        partySize: reservation.partySize,
        firstName: reservation.firstName,
        lastName: reservation.lastName,
        email: reservation.email,
        phone: reservation.phone,
        occasion: reservation.occasion,
        specialRequest: reservation.specialRequest,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Données invalides" },
        { status: 400 },
      );
    }
    const message =
      err instanceof Error ? err.message : "Réservation impossible.";
    const status = message.includes("complet") || message.includes("disponible")
      ? 409
      : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
