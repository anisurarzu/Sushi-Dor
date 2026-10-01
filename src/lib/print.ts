import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";
import type { PrintJob } from "@prisma/client";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function line(text: string): string {
  return `<text>${escapeXml(text)}&#10;</text>`;
}

function orderTypeLabel(type: string): string {
  if (type === "DELIVERY") return "LIVRAISON";
  if (type === "DINE_IN") return "SUR PLACE";
  return "A EMPORTER";
}

type OrderForPrint = {
  id: string;
  orderNumber: string;
  type: string;
  totalCents: number;
  productsSubtotalCents: number;
  addonsSubtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryStreet: string | null;
  deliveryComplement: string | null;
  deliveryPostalCode: string | null;
  deliveryCity: string | null;
  deliveryNotes: string | null;
  notes: string | null;
  paidAt: Date | null;
  createdAt: Date;
  restaurant: {
    id: string;
    name: string;
    address: string;
    postalCode: string;
    city: string;
    phone: string | null;
  };
  items: {
    productNameSnapshot: string;
    quantity: number;
    unitPriceSnapshot: number;
    lineTotalCents: number;
    addons: {
      addonNameSnapshot: string;
      quantity: number;
      priceSnapshot: number;
    }[];
  }[];
};

/** Build Epson ePOS-Print XML for TM-m30 / TM-m30III. */
export function buildEposXml(order: OrderForPrint): string {
  const when = order.paidAt ?? order.createdAt;
  const whenFr = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(when);

  const parts: string[] = [];
  parts.push(`<text lang="fr"/>`);
  parts.push(`<text align="center"/>`);
  parts.push(line("SUSHI D'OR"));
  parts.push(line(order.restaurant.name));
  parts.push(line(`${order.restaurant.address}`));
  parts.push(
    line(`${order.restaurant.postalCode} ${order.restaurant.city}`),
  );
  if (order.restaurant.phone) parts.push(line(order.restaurant.phone));
  parts.push(`<text align="left"/>`);
  parts.push(`<feed unit="16"/>`);
  parts.push(`<text align="center"/>`);
  parts.push(`<text width="2" height="2"/>`);
  parts.push(line(`#${order.orderNumber}`));
  parts.push(`<text width="1" height="1"/>`);
  parts.push(line(orderTypeLabel(order.type)));
  parts.push(`<text align="left"/>`);
  parts.push(line(whenFr));
  parts.push(line("-".repeat(42)));
  parts.push(
    line(
      `${order.customerFirstName} ${order.customerLastName}`.trim() ||
        "Client",
    ),
  );
  parts.push(line(order.customerPhone));
  if (order.type === "DELIVERY") {
    parts.push(line("Adresse livraison:"));
    if (order.deliveryStreet) parts.push(line(order.deliveryStreet));
    if (order.deliveryComplement) parts.push(line(order.deliveryComplement));
    parts.push(
      line(
        `${order.deliveryPostalCode ?? ""} ${order.deliveryCity ?? ""}`.trim(),
      ),
    );
    if (order.deliveryNotes) parts.push(line(`Note: ${order.deliveryNotes}`));
  }
  parts.push(line("-".repeat(42)));

  for (const item of order.items) {
    parts.push(
      line(
        `${item.quantity}x ${item.productNameSnapshot}  ${formatEuro(item.lineTotalCents)}`,
      ),
    );
    for (const a of item.addons) {
      const price =
        a.priceSnapshot > 0 ? ` +${formatEuro(a.priceSnapshot)}` : "";
      parts.push(line(`   + ${a.addonNameSnapshot}${price}`));
    }
  }

  parts.push(line("-".repeat(42)));
  parts.push(line(`Sous-total   ${formatEuro(order.productsSubtotalCents)}`));
  if (order.addonsSubtotalCents > 0) {
    parts.push(line(`Options     ${formatEuro(order.addonsSubtotalCents)}`));
  }
  if (order.deliveryFeeCents > 0) {
    parts.push(line(`Livraison   ${formatEuro(order.deliveryFeeCents)}`));
  }
  if (order.discountCents > 0) {
    parts.push(line(`Remise     -${formatEuro(order.discountCents)}`));
  }
  parts.push(`<text width="2" height="2"/>`);
  parts.push(line(`TOTAL  ${formatEuro(order.totalCents)}`));
  parts.push(`<text width="1" height="1"/>`);
  parts.push(line("Paye - Stripe"));
  if (order.notes) {
    parts.push(line("-".repeat(42)));
    parts.push(line(`Note: ${order.notes}`));
  }
  parts.push(`<feed unit="24"/>`);
  parts.push(`<text align="center"/>`);
  parts.push(line("Merci et bon appetit !"));
  parts.push(`<feed unit="32"/>`);
  parts.push(`<cut type="feed"/>`);

  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
${parts.join("\n")}
    </epos-print>
  </s:Body>
</s:Envelope>`;
}

/** Minimal ESC/POS ticket (TCP 9100 fallback). */
export function buildEscPosBase64(order: OrderForPrint): string {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const push = (s: string | Uint8Array) => {
    chunks.push(typeof s === "string" ? enc.encode(s) : s);
  };
  push(new Uint8Array([0x1b, 0x40])); // init
  push(new Uint8Array([0x1b, 0x61, 0x01])); // center
  push("SUSHI D'OR\n");
  push(`${order.restaurant.name}\n`);
  push(new Uint8Array([0x1b, 0x61, 0x00])); // left
  push(`#${order.orderNumber}  ${orderTypeLabel(order.type)}\n`);
  push("-".repeat(32) + "\n");
  for (const item of order.items) {
    push(`${item.quantity}x ${item.productNameSnapshot}\n`);
    for (const a of item.addons) push(`  + ${a.addonNameSnapshot}\n`);
  }
  push("-".repeat(32) + "\n");
  push(`TOTAL ${formatEuro(order.totalCents)}\n`);
  push("Paye - Stripe\n\n");
  push("Merci !\n\n\n");
  push(new Uint8Array([0x1d, 0x56, 0x00])); // cut

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return Buffer.from(out).toString("base64");
}

const orderPrintInclude = {
  restaurant: true,
  items: { include: { addons: true } },
} as const;

/**
 * Queue a kitchen/customer receipt when an order becomes PAID.
 * Idempotent for auto path: skips if a non-failed RECEIPT already exists.
 */
export async function enqueuePrintForOrder(
  orderId: string,
  opts?: { force?: boolean },
): Promise<PrintJob | null> {
  if (!opts?.force) {
    const existing = await prisma.printJob.findFirst({
      where: {
        orderId,
        kind: "RECEIPT",
        status: { in: ["PENDING", "CLAIMED", "PRINTED"] },
      },
      orderBy: { createdAt: "desc" },
    });
    if (existing) return existing;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderPrintInclude,
  });
  if (!order || order.paymentStatus !== "PAID") return null;

  const eposXml = buildEposXml(order);
  const escposBase64 = buildEscPosBase64(order);

  return prisma.printJob.create({
    data: {
      orderId: order.id,
      restaurantId: order.restaurantId,
      kind: "RECEIPT",
      status: "PENDING",
      eposXml,
      escposBase64,
      payloadJson: JSON.stringify({
        orderNumber: order.orderNumber,
        totalCents: order.totalCents,
        type: order.type,
      }),
    },
  });
}
