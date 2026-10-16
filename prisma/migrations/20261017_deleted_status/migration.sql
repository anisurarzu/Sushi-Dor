-- Soft-delete flag: 0 = active, 255 = soft-deleted (hidden from UI)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedStatus" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "deletedStatus" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "deletedStatus" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deletedStatus" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Discount" ADD COLUMN IF NOT EXISTS "deletedStatus" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "deletedStatus" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "User_deletedStatus_idx" ON "User"("deletedStatus");
CREATE INDEX IF NOT EXISTS "Category_deletedStatus_idx" ON "Category"("deletedStatus");
CREATE INDEX IF NOT EXISTS "Product_deletedStatus_idx" ON "Product"("deletedStatus");
CREATE INDEX IF NOT EXISTS "Order_deletedStatus_idx" ON "Order"("deletedStatus");
CREATE INDEX IF NOT EXISTS "Discount_deletedStatus_idx" ON "Discount"("deletedStatus");
CREATE INDEX IF NOT EXISTS "Reservation_deletedStatus_idx" ON "Reservation"("deletedStatus");
