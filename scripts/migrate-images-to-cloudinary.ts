/**
 * Migrate product images from local public/ paths to Cloudinary.
 * Usage: npx tsx scripts/migrate-images-to-cloudinary.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  getImageUploadProvider,
  migrateImageUrlToCloudinary,
} from "../src/lib/product-images";

const prisma = new PrismaClient();

async function main() {
  const provider = getImageUploadProvider();
  if (provider !== "cloudinary") {
    throw new Error(
      "Cloudinary env missing (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET).",
    );
  }

  const products = await prisma.product.findMany({
    include: { images: { orderBy: { displayOrder: "asc" } } },
  });

  let migratedImages = 0;
  let migratedPrimary = 0;
  let skipped = 0;
  let failed = 0;

  for (const product of products) {
    // ProductImage rows
    for (const image of product.images) {
      if (image.url.includes("res.cloudinary.com")) {
        skipped += 1;
        continue;
      }
      try {
        const url = await migrateImageUrlToCloudinary(image.url, product.id);
        await prisma.productImage.update({
          where: { id: image.id },
          data: { url },
        });
        migratedImages += 1;
        console.log(`✓ image ${product.nameFr} → ${url.slice(0, 80)}…`);
      } catch (e) {
        failed += 1;
        console.error(`✗ image ${product.nameFr} (${image.url}):`, e);
      }
    }

    // Primary imageUrl on product
    if (product.imageUrl && !product.imageUrl.includes("res.cloudinary.com")) {
      try {
        // Prefer first ProductImage if already migrated
        const primary = await prisma.productImage.findFirst({
          where: { productId: product.id },
          orderBy: { displayOrder: "asc" },
        });
        let url = primary?.url;
        if (!url || !url.includes("res.cloudinary.com")) {
          url = await migrateImageUrlToCloudinary(
            product.imageUrl,
            product.id,
          );
        }
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: url },
        });
        migratedPrimary += 1;
      } catch (e) {
        failed += 1;
        console.error(`✗ primary ${product.nameFr}:`, e);
      }
    } else if (product.imageUrl?.includes("res.cloudinary.com")) {
      skipped += 1;
    } else {
      // Sync primary from first gallery image if missing
      const primary = await prisma.productImage.findFirst({
        where: { productId: product.id },
        orderBy: { displayOrder: "asc" },
      });
      if (primary?.url) {
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: primary.url },
        });
      }
    }
  }

  console.log(
    JSON.stringify(
      { migratedImages, migratedPrimary, skipped, failed, totalProducts: products.length },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
