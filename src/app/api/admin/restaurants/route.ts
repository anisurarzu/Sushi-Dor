import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().min(1).max(200),
  postalCode: z.string().min(4).max(12),
  city: z.string().min(1).max(100),
  phone: z.string().max(40).nullable().optional(),
  email: z.string().email().nullable().optional(),
  deliveryEnabled: z.boolean().optional(),
  pickupEnabled: z.boolean().optional(),
  reservationEnabled: z.boolean().optional(),
  isActive: z.boolean().optional(),
  deliveryFeeCents: z.number().int().min(0).optional(),
  minOrderCents: z.number().int().min(0).optional(),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: Request) {
  const admin = await requireAdminApi("restaurants.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = schema.parse(await req.json());
  let slug = slugify(body.name);
  let n = 1;
  while (await prisma.restaurant.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${slugify(body.name)}-${n}`;
  }
  const restaurant = await prisma.restaurant.create({
    data: {
      slug,
      name: body.name,
      address: body.address,
      postalCode: body.postalCode,
      city: body.city,
      phone: body.phone || null,
      email: body.email || null,
      deliveryEnabled: body.deliveryEnabled ?? true,
      pickupEnabled: body.pickupEnabled ?? true,
      reservationEnabled: body.reservationEnabled ?? true,
      isActive: body.isActive ?? true,
      deliveryFeeCents: body.deliveryFeeCents ?? 300,
      minOrderCents: body.minOrderCents ?? 0,
    },
  });
  await writeAudit({
    userId: admin.id,
    action: "restaurant.create",
    entity: "Restaurant",
    entityId: restaurant.id,
  });
  return NextResponse.json({ ok: true, restaurant });
}
