import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { ALL_PERMISSIONS, effectiveRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(40).nullable().optional(),
  role: z.enum(["SUPER_ADMIN", "MANAGER", "STAFF", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).max(128).optional(),
  extraPermissions: z
    .array(z.object({ permission: z.string(), granted: z.boolean() }))
    .optional(),
});

export async function GET(_req: Request, { params }: Params) {
  const admin = await requireAdminApi("users.view");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      userPermissions: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
  return NextResponse.json({ user });
}

export async function PATCH(req: Request, { params }: Params) {
  const admin = await requireAdminApi("users.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const body = patchSchema.parse(await req.json());
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const actorIsSuper =
    effectiveRole(admin.role) === "SUPER_ADMIN" || admin.role === "ADMIN";
  const targetIsSuper =
    effectiveRole(target.role) === "SUPER_ADMIN" || target.role === "ADMIN";

  if (targetIsSuper && !actorIsSuper) {
    return NextResponse.json(
      { error: "Impossible de modifier un SUPER_ADMIN." },
      { status: 403 },
    );
  }

  if (
    body.role &&
    (body.role === "SUPER_ADMIN" || body.role === "ADMIN") &&
    !actorIsSuper
  ) {
    return NextResponse.json(
      { error: "Seul un SUPER_ADMIN peut assigner ce rôle." },
      { status: 403 },
    );
  }

  if (body.isActive === false && targetIsSuper) {
    const supers = await prisma.user.count({
      where: {
        role: { in: ["SUPER_ADMIN", "ADMIN"] },
        isActive: true,
        id: { not: id },
      },
    });
    if (supers === 0) {
      return NextResponse.json(
        { error: "Impossible de désactiver le dernier SUPER_ADMIN." },
        { status: 400 },
      );
    }
  }

  if (admin.id === id && body.extraPermissions) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas modifier vos propres permissions." },
      { status: 403 },
    );
  }

  const data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
    role?: "SUPER_ADMIN" | "MANAGER" | "STAFF" | "ADMIN";
    isActive?: boolean;
    passwordHash?: string;
  } = {};

  if (body.firstName !== undefined) data.firstName = body.firstName;
  if (body.lastName !== undefined) data.lastName = body.lastName;
  if (body.email !== undefined) data.email = body.email.toLowerCase();
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.role !== undefined) {
    data.role = body.role === "ADMIN" ? "SUPER_ADMIN" : body.role;
  }
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.password) {
    data.passwordHash = await bcrypt.hash(body.password, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
    },
  });

  if (body.extraPermissions && actorIsSuper) {
    for (const row of body.extraPermissions) {
      if (!ALL_PERMISSIONS.includes(row.permission as (typeof ALL_PERMISSIONS)[number])) {
        continue;
      }
      await prisma.userPermission.upsert({
        where: {
          userId_permission: { userId: id, permission: row.permission },
        },
        create: {
          userId: id,
          permission: row.permission,
          granted: row.granted,
        },
        update: { granted: row.granted },
      });
    }
  }

  await writeAudit({
    userId: admin.id,
    action: "user.update",
    entity: "User",
    entityId: id,
    meta: {
      ...body,
      password: body.password ? "[set]" : undefined,
    },
  });

  return NextResponse.json({ ok: true, user });
}
