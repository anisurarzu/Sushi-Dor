import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Role, User } from "@prisma/client";
import {
  type Permission,
  roleHasPermission,
  effectiveRole,
} from "@/lib/permissions";

export type AdminUser = Pick<
  User,
  "id" | "email" | "firstName" | "lastName" | "role" | "isActive"
>;

const STAFF_LIKE: Role[] = ["ADMIN", "SUPER_ADMIN", "MANAGER", "STAFF"];

export async function getAdminUser(): Promise<AdminUser | null> {
  const jar = await cookies();
  const token = jar.get("sd_admin")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: token },
    include: { user: true },
  });
  if (
    !session ||
    session.expiresAt < new Date() ||
    !STAFF_LIKE.includes(session.user.role) ||
    !session.user.isActive
  ) {
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    role: session.user.role,
    isActive: session.user.isActive,
  };
}

export async function userHasPermission(
  user: AdminUser,
  permission: Permission,
): Promise<boolean> {
  if (effectiveRole(user.role) === "SUPER_ADMIN" || user.role === "ADMIN") {
    return true;
  }

  const roleKey = effectiveRole(user.role);
  const roleDef = await prisma.roleDef.findUnique({
    where: { key: roleKey },
    include: { permissions: true },
  });

  let fromRole = false;
  if (roleDef) {
    fromRole = roleDef.permissions.some((p) => p.permission === permission);
  } else {
    fromRole = roleHasPermission(user.role, permission);
  }

  if (fromRole) {
    const deny = await prisma.userPermission.findUnique({
      where: {
        userId_permission: { userId: user.id, permission },
      },
    });
    if (deny && !deny.granted) return false;
    return true;
  }

  const grant = await prisma.userPermission.findUnique({
    where: {
      userId_permission: { userId: user.id, permission },
    },
  });
  return Boolean(grant?.granted);
}

function resolvePermission(
  input?: Permission | "ADMIN" | "STAFF" | string,
): Permission {
  if (!input || input === "STAFF") return "dashboard.view";
  if (input === "ADMIN") return "settings.edit";
  return input as Permission;
}

export async function requireAdmin(
  permission: Permission | "ADMIN" | "STAFF" = "dashboard.view",
): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  const perm = resolvePermission(permission);
  if (!(await userHasPermission(user, perm))) {
    redirect("/admin");
  }
  return user;
}

/** @deprecated prefer requireAdmin(permission) */
export async function requireAdminRole(
  minRole: "STAFF" | "ADMIN" = "STAFF",
): Promise<AdminUser> {
  return requireAdmin(minRole);
}

export async function requireAdminApi(
  permission: Permission | "ADMIN" | "STAFF" = "dashboard.view",
): Promise<AdminUser | null> {
  const user = await getAdminUser();
  if (!user) return null;
  const perm = resolvePermission(permission);
  if (!(await userHasPermission(user, perm))) return null;
  return user;
}

export async function writeAudit(input: {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? undefined,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      meta: input.meta
        ? (JSON.parse(JSON.stringify(input.meta)) as object)
        : undefined,
    },
  });
}
