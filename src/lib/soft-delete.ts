/** Soft-deleted rows stay in DB but are hidden from admin/storefront lists. */
export const SOFT_DELETED = 255;
export const NOT_DELETED = 0;

export const notDeleted = { deletedStatus: NOT_DELETED } as const;

export type BulkDeleteResource =
  | "orders"
  | "users"
  | "categories"
  | "products"
  | "discounts"
  | "reservations";
