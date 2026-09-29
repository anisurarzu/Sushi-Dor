import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getAdminUser, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z.string().max(40).nullable().optional(),
  password: z.string().min(8).max(128).optional(),
});

export async function PATCH(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = schema.parse(await req.json());
  const data: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    passwordHash?: string;
  } = {};
  if (body.firstName !== undefined) data.firstName = body.firstName;
  if (body.lastName !== undefined) data.lastName = body.lastName;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 12);

  const user = await prisma.user.update({
    where: { id: admin.id },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
    },
  });

  await writeAudit({
    userId: admin.id,
    action: "profile.update",
    entity: "User",
    entityId: admin.id,
  });

  return NextResponse.json({ ok: true, user });
}
