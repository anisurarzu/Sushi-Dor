import { NextResponse } from "next/server";
import { z } from "zod";
import {
  cancelReservation,
  createReservation,
  findReservationByCodeEmail,
  findReservationByToken,
  publicReservationView,
  sendReservationEmail,
} from "@/lib/reservations";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const lookupSchema = z.object({
  token: z.string().min(16).optional(),
  code: z.string().min(4).optional(),
  email: z.string().email().optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = lookupSchema.parse({
      token: url.searchParams.get("token") || undefined,
      code: url.searchParams.get("code") || undefined,
      email: url.searchParams.get("email") || undefined,
    });

    const reservation = parsed.token
      ? await findReservationByToken(parsed.token)
      : parsed.code && parsed.email
        ? await findReservationByCodeEmail(parsed.code, parsed.email)
        : null;

    if (!reservation) {
      return NextResponse.json(
        { error: "Réservation introuvable." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      reservation: publicReservationView(reservation),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Recherche impossible.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

const cancelSchema = z.object({
  token: z.string().min(16).optional(),
  code: z.string().min(4).optional(),
  email: z.string().email().optional(),
});

export async function DELETE(req: Request) {
  try {
    const body = cancelSchema.parse(await req.json());
    const found = body.token
      ? await findReservationByToken(body.token)
      : body.code && body.email
        ? await findReservationByCodeEmail(body.code, body.email)
        : null;

    if (!found) {
      return NextResponse.json(
        { error: "Réservation introuvable." },
        { status: 404 },
      );
    }
    if (found.status === "CANCELLED") {
      return NextResponse.json({
        ok: true,
        reservation: publicReservationView(found),
      });
    }
    if (found.status === "COMPLETED" || found.status === "NO_SHOW") {
      return NextResponse.json(
        { error: "Cette réservation ne peut plus être annulée." },
        { status: 400 },
      );
    }

    const reservation = await cancelReservation(found.id);
    void sendReservationEmail({
      reservation,
      restaurantName: reservation.restaurant.name,
      restaurantPhone: reservation.restaurant.phone,
      kind: "cancelled",
    });

    return NextResponse.json({
      ok: true,
      reservation: publicReservationView(reservation),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Données invalides" },
        { status: 400 },
      );
    }
    const message =
      err instanceof Error ? err.message : "Annulation impossible.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

const modifySchema = z.object({
  token: z.string().min(16),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.number().int().min(1).max(40),
  specialRequest: z.string().max(500).nullable().optional(),
  occasion: z.string().max(40).nullable().optional(),
});

/** Modify an upcoming reservation via cancel-token (cancel + rebook atomically-ish). */
export async function PATCH(req: Request) {
  try {
    const body = modifySchema.parse(await req.json());
    const existing = await findReservationByToken(body.token);
    if (!existing) {
      return NextResponse.json(
        { error: "Réservation introuvable." },
        { status: 404 },
      );
    }
    if (existing.status !== "PENDING" && existing.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Cette réservation ne peut plus être modifiée." },
        { status: 400 },
      );
    }

    // Free capacity from the old booking first
    await prisma.reservation.update({
      where: { id: existing.id },
      data: { status: "CANCELLED" },
    });

    try {
      const { reservation, cancelToken } = await createReservation({
        restaurantId: existing.restaurantId,
        date: body.date,
        startTime: body.startTime,
        partySize: body.partySize,
        firstName: existing.firstName,
        lastName: existing.lastName,
        email: existing.email,
        phone: existing.phone,
        occasion: body.occasion ?? existing.occasion,
        specialRequest:
          body.specialRequest !== undefined
            ? body.specialRequest
            : existing.specialRequest,
        source: existing.source,
      });

      const restaurant = await prisma.restaurant.findUnique({
        where: { id: reservation.restaurantId },
      });
      const kind =
        reservation.status === "PENDING" ? "pending" : "updated";
      void sendReservationEmail({
        reservation,
        restaurantName: restaurant?.name || "Sushi D'or",
        restaurantPhone: restaurant?.phone,
        cancelToken,
        kind,
      });

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
      // Restore previous booking if rebook failed
      await prisma.reservation.update({
        where: { id: existing.id },
        data: { status: existing.status },
      });
      throw err;
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Données invalides" },
        { status: 400 },
      );
    }
    const message =
      err instanceof Error ? err.message : "Modification impossible.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
