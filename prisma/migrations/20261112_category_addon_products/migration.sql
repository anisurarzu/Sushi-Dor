-- Category-level optional upsell products (e.g. Menu Box extras)
CREATE TABLE IF NOT EXISTS "CategoryAddonProduct" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CategoryAddonProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CategoryAddonProduct_categoryId_productId_key"
  ON "CategoryAddonProduct"("categoryId", "productId");

CREATE INDEX IF NOT EXISTS "CategoryAddonProduct_categoryId_sortOrder_idx"
  ON "CategoryAddonProduct"("categoryId", "sortOrder");

CREATE INDEX IF NOT EXISTS "CategoryAddonProduct_productId_idx"
  ON "CategoryAddonProduct"("productId");

DO $$ BEGIN
  ALTER TABLE "CategoryAddonProduct"
    ADD CONSTRAINT "CategoryAddonProduct_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CategoryAddonProduct"
    ADD CONSTRAINT "CategoryAddonProduct_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
