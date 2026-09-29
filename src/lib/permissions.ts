import type { Role } from "@prisma/client";

export const ALL_PERMISSIONS = [
  "dashboard.view",
  "orders.view",
  "orders.create",
  "orders.edit",
  "orders.cancel",
  "orders.refund",
  "products.view",
  "products.create",
  "products.edit",
  "products.archive",
  "categories.view",
  "categories.create",
  "categories.edit",
  "categories.archive",
  "addons.view",
  "addons.create",
  "addons.edit",
  "addons.archive",
  "reservations.view",
  "reservations.create",
  "reservations.edit",
  "reservations.cancel",
  "customers.view",
  "customers.edit",
  "customers.delete",
  "users.view",
  "users.create",
  "users.edit",
  "users.deactivate",
  "roles.view",
  "roles.create",
  "roles.edit",
  "roles.delete",
  "analytics.view",
  "settings.view",
  "settings.edit",
  "audit_logs.view",
  "restaurants.view",
  "restaurants.edit",
  "delivery.view",
  "delivery.edit",
  "discounts.view",
  "discounts.edit",
  "payments.view",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

const STAFF_PERMS: Permission[] = [
  "dashboard.view",
  "orders.view",
  "orders.edit",
  "reservations.view",
  "reservations.edit",
  "products.view",
  "customers.view",
];

const MANAGER_PERMS: Permission[] = [
  ...STAFF_PERMS,
  "orders.create",
  "orders.cancel",
  "products.create",
  "products.edit",
  "products.archive",
  "categories.view",
  "categories.create",
  "categories.edit",
  "addons.view",
  "addons.create",
  "addons.edit",
  "reservations.create",
  "reservations.cancel",
  "customers.edit",
  "analytics.view",
  "delivery.view",
  "delivery.edit",
  "discounts.view",
  "discounts.edit",
  "payments.view",
  "restaurants.view",
  "settings.view",
];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  STAFF: STAFF_PERMS,
  MANAGER: MANAGER_PERMS,
  ADMIN: [...ALL_PERMISSIONS],
  SUPER_ADMIN: [...ALL_PERMISSIONS],
};

export function effectiveRole(role: Role): string {
  if (role === "ADMIN") return "SUPER_ADMIN";
  return role;
}

export function roleHasPermission(role: Role, permission: Permission): boolean {
  const key = effectiveRole(role);
  return (ROLE_PERMISSIONS[key] || []).includes(permission);
}
