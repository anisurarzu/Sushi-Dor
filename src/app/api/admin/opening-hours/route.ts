import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const hourSchema = z.object({
  id: z.string().optional(),
  dayOfWeek: z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  service: z.string().default("ALL"),
  isClosed: z.boolean().default(false),
});

const schema = z.object({
  restaurantId: z.string().min(1),
  hours: z.array(hourSchema),
  blockedDates: z
    .array(
      z.object({
        id: z.string().optional(),
        date: z.string(),
        reason: z.string().max(200).nullable().optional(),
      }),
    )
    .optional(),
});

export async function PUT(req: Request) {
  const admin = await requireAdminApi("settings.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = schema.parse(await req.json());
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: body.restaurantId },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.openingHour.deleteMany({
      where: { restaurantId: body.restaurantId },
    });
    if (body.hours.length > 0) {
      await tx.openingHour.createMany({
        data: body.hours.map((h) => ({
          restaurantId: body.restaurantId,
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          service: h.service || "ALL",
          isClosed: h.isClosed,
        })),
      });
    }
    if (body.blockedDates) {
      await tx.blockedDate.deleteMany({
        where: { restaurantId: body.restaurantId },
      });
      if (body.blockedDates.length > 0) {
        await tx.blockedDate.createMany({
          data: body.blockedDates.map((d) => ({
            restaurantId: body.restaurantId,
            date: new Date(d.date),
            reason: d.reason || null,
          })),
        });
      }
    }
  });

  await writeAudit({
    userId: admin.id,
    action: "opening_hours.update",
    entity: "Restaurant",
    entityId: body.restaurantId,
  });

  const updated = await prisma.restaurant.findUnique({
    where: { id: body.restaurantId },
    include: { openingHours: true, blockedDates: true },
  });

  return NextResponse.json({ ok: true, restaurant: updated });
}
