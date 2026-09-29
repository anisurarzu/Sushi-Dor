import { requireAdmin } from "@/lib/admin-auth";
import { ALL_PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { RolePermissionsEditor } from "@/components/admin/RolePermissionsEditor";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  await requireAdmin("roles.view");
  let roles = await prisma.roleDef.findMany({
    include: { permissions: true },
    orderBy: { key: "asc" },
  });
  if (roles.length === 0) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Rôles & permissions
        </h1>
        <p className="mt-1 text-sm text-[#a89f8e]">
          Les changements sont persistés en base et appliqués côté API.
        </p>
      </div>
      <RolePermissionsEditor
        initialRoles={roles.map((r) => ({
          id: r.id,
          key: r.key,
          nameFr: r.nameFr,
          permissions: r.permissions.map((p) => ({
            permission: p.permission,
          })),
        }))}
        allPermissions={[...ALL_PERMISSIONS]}
      />
    </div>
  );
}
