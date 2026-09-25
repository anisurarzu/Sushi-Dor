import { PrismaClient } from "@prisma/client";

const BASE = process.env.SMOKE_BASE || "http://127.0.0.1:3000";

async function main() {
  const prisma = new PrismaClient();
  const product = await prisma.product.findFirst({
    where: { sku: "110" },
    include: { addonGroups: { include: { addons: true } } },
  });
  if (!product) throw new Error("California product missing");
  const spicy = product.addonGroups.flatMap((g) => g.addons).find((a) => /spicy/i.test(a.nameFr));
  const avocat = product.addonGroups.flatMap((g) => g.addons).find((a) => a.nameFr === "Avocat");
  if (!spicy || !avocat) throw new Error("addons missing");

  const addRes = await fetch(`${BASE}/api/cart/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: product.id,
      quantity: 2,
      addonIds: [spicy.id, avocat.id],
    }),
  });
  const addJson = await addRes.json();
  if (!addRes.ok) throw new Error(JSON.stringify(addJson));
  const item = addJson.cart.items[0];
  const expected = (product.priceCents + spicy.priceCents + avocat.priceCents) * 2;
  console.log({ ok: item.lineTotalCents === expected, line: item.lineTotalCents, expected });
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
