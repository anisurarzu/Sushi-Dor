import { PrismaClient, AddonSelectionType } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

type MenuJson = {
  categories: { slug: string; nameFr: string; sortOrder: number; imageUrl: string }[];
  products: {
    sku: string;
    slug: string;
    nameFr: string;
    description: string | null;
    priceCents: number;
    categorySlug: string;
    imageUrl: string;
    sortOrder: number;
  }[];
};

async function main() {
  const menuPath = join(process.cwd(), "src/data/menu.json");
  const menu = JSON.parse(readFileSync(menuPath, "utf8")) as MenuJson;

  console.log("Seeding restaurant…");
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "sushi-dor-annemasse" },
    update: {
      name: "Sushi D'or",
      address: "À préciser",
      postalCode: "74100",
      city: "Annemasse",
      deliveryEnabled: true,
      pickupEnabled: true,
      deliveryFeeCents: 300,
      isActive: true,
    },
    create: {
      slug: "sushi-dor-annemasse",
      name: "Sushi D'or",
      address: "À préciser",
      postalCode: "74100",
      city: "Annemasse",
      phone: null,
      email: "contact@sushidor.fr",
      deliveryEnabled: true,
      pickupEnabled: true,
      deliveryFeeCents: 300,
      maxItemQuantity: 20,
    },
  });

  await prisma.deliveryZone.deleteMany({ where: { restaurantId: restaurant.id } });
  await prisma.deliveryZone.create({
    data: {
      restaurantId: restaurant.id,
      name: "Annemasse / Thonon",
      postalCodes: ["74100", "74200", "74940"],
      feeCents: 300,
      minOrderCents: 1500,
      isActive: true,
    },
  });

  console.log("Seeding categories & products…");
  for (const cat of menu.categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        nameFr: cat.nameFr,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
      create: {
        slug: cat.slug,
        nameFr: cat.nameFr,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
      },
    });
  }

  const categories = await prisma.category.findMany();
  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  // Clear catalog for clean reseed (keeps orders if any — full reset preferred in dev)
  await prisma.cartItemAddon.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItemAddon.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productAddonAllergen.deleteMany();
  await prisma.productAddon.deleteMany();
  await prisma.productAddonGroup.deleteMany();
  await prisma.productAllergen.deleteMany();
  await prisma.productIngredient.deleteMany();
  await prisma.product.deleteMany();

  const seenSkus = new Set<string>();
  for (const p of menu.products) {
    const category = catBySlug[p.categorySlug];
    if (!category) continue;
    let sku = p.sku;
    if (seenSkus.has(sku)) sku = `${sku}-${p.slug.slice(0, 12)}`;
    seenSkus.add(sku);
    await prisma.product.create({
      data: {
        slug: p.slug,
        sku,
        nameFr: p.nameFr,
        description: p.description,
        priceCents: p.priceCents,
        imageUrl: p.imageUrl,
        categoryId: category.id,
        sortOrder: p.sortOrder,
        isAvailable: true,
        isFeatured: ["23", "86", "110", "118", "119"].includes(p.sku),
      },
    });
  }

  // Configurable add-ons for California Saumon Avocat (sku 110) — example from spec
  const california = await prisma.product.findFirst({
    where: {
      OR: [
        { sku: "110" },
        { nameFr: { contains: "California SAUMON AVOCAT", mode: "insensitive" } },
        { slug: { contains: "california-saumon-avocat" } },
      ],
    },
  });

  if (california) {
    console.log("Seeding add-ons for", california.nameFr);
    await prisma.productAddonGroup.deleteMany({
      where: { productId: california.id },
    });

    const sauceGroup = await prisma.productAddonGroup.create({
      data: {
        productId: california.id,
        nameFr: "Choisissez votre sauce",
        selectionType: AddonSelectionType.SINGLE,
        required: true,
        minSelections: 1,
        maxSelections: 1,
        displayOrder: 1,
        isActive: true,
        addons: {
          create: [
            { nameFr: "Sauce Soja", priceCents: 0, displayOrder: 1 },
            { nameFr: "Sauce Sucrée", priceCents: 50, displayOrder: 2 },
            { nameFr: "Sauce Spicy", priceCents: 50, displayOrder: 3 },
          ],
        },
      },
    });

    const extrasGroup = await prisma.productAddonGroup.create({
      data: {
        productId: california.id,
        nameFr: "Extras",
        selectionType: AddonSelectionType.MULTIPLE,
        required: false,
        minSelections: 0,
        maxSelections: 5,
        displayOrder: 2,
        isActive: true,
        addons: {
          create: [
            { nameFr: "Avocat", priceCents: 150, displayOrder: 1 },
            { nameFr: "Cream Cheese", priceCents: 150, displayOrder: 2 },
            { nameFr: "Saumon supplémentaire", priceCents: 250, displayOrder: 3 },
          ],
        },
      },
    });

    await prisma.productAddonGroup.create({
      data: {
        productId: california.id,
        nameFr: "Toppings",
        selectionType: AddonSelectionType.MULTIPLE,
        required: false,
        minSelections: 0,
        maxSelections: 3,
        displayOrder: 3,
        isActive: true,
        addons: {
          create: [
            { nameFr: "Sésame", priceCents: 80, displayOrder: 1 },
            { nameFr: "Oignons frits", priceCents: 80, displayOrder: 2 },
          ],
        },
      },
    });

    console.log("Addon groups:", sauceGroup.id, extrasGroup.id);
  }

  // Light optional add-ons for a few maki/sushi products (no allergens invented)
  const customizable = await prisma.product.findMany({
    where: {
      sku: { in: ["90", "20", "111"] },
    },
  });
  for (const product of customizable) {
    const existing = await prisma.productAddonGroup.count({
      where: { productId: product.id },
    });
    if (existing > 0) continue;
    await prisma.productAddonGroup.create({
      data: {
        productId: product.id,
        nameFr: "Sauce (optionnelle)",
        selectionType: AddonSelectionType.SINGLE,
        required: false,
        minSelections: 0,
        maxSelections: 1,
        displayOrder: 1,
        addons: {
          create: [
            { nameFr: "Sauce Soja", priceCents: 0, displayOrder: 1 },
            { nameFr: "Sauce Spicy", priceCents: 50, displayOrder: 2 },
          ],
        },
      },
    });
  }

  // Admin user (password must be changed) — bcrypt hash for "ChangeMe123!"
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@sushidor.fr" },
    update: { role: "ADMIN", passwordHash },
    create: {
      email: "admin@sushidor.fr",
      firstName: "Admin",
      lastName: "Sushi D'or",
      role: "ADMIN",
      passwordHash,
    },
  });

  console.log("Seed complete.");
  console.log("Restaurant:", restaurant.slug);
  console.log("Products:", await prisma.product.count());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
