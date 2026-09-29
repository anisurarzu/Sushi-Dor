import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { ALL_PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdminApi("roles.view");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  let roles = await prisma.roleDef.findMany({
    include: { permissions: true },
    orderBy: { key: "asc" },
  });
  if (roles.length === 0) {
    // Bootstrap from code defaults
    for (const [key, perms] of Object.entries(ROLE_PERMISSIONS)) {
      if (key === "ADMIN") continue;
      await prisma.roleDef.create({
        data: {
          key,
          nameFr:
            key === "SUPER_ADMIN"
              ? "Super Admin"
              : key === "MANAGER"
                ? "Manager"
                : "Staff",
          permissions: {
            create: perms.map((permission) => ({ permission })),
          },
        },
      });
    }
    roles = await prisma.roleDef.findMany({
      include: { permissions: true },
      orderBy: { key: "asc" },
    });
  }
  return NextResponse.json({ roles, allPermissions: ALL_PERMISSIONS });
}

const patchSchema = z.object({
  roleKey: z.string().min(1),
  permissions: z.array(z.string()),
});

export async function PATCH(req: Request) {
  const admin = await requireAdminApi("roles.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = patchSchema.parse(await req.json());
  if (body.roleKey === "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Les permissions SUPER_ADMIN sont fixes." },
      { status: 400 },
    );
  }

  const role = await prisma.roleDef.findUnique({ where: { key: body.roleKey } });
  if (!role) {
    return NextResponse.json({ error: "Rôle introuvable" }, { status: 404 });
  }

  const valid = body.permissions.filter((p) =>
    ALL_PERMISSIONS.includes(p as (typeof ALL_PERMISSIONS)[number]),
  );

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
    prisma.rolePermission.createMany({
      data: valid.map((permission) => ({
        roleId: role.id,
        permission,
      })),
    }),
  ]);

  await writeAudit({
    userId: admin.id,
    action: "role.permissions_update",
    entity: "RoleDef",
    entityId: role.id,
    meta: { key: body.roleKey, permissions: valid },
  });

  return NextResponse.json({ ok: true });
}
