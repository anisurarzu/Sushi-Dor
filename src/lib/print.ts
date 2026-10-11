import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";
import type { PrintJob } from "@prisma/client";

/** 80mm Epson TM-m30 ≈ 42 chars at normal width; use 40 for safe padding. */
const COL = 40;

/** Shop address printed at the bottom of every ticket. */
const SHOP_FOOTER_ADDRESS = "37 Rue du Chablais, 74100 Annemasse";

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

/** Left label + right price on one line (monospace receipt columns). */
function pairLine(left: string, right: string, width = COL): string {
  const price = right.trim();
  const maxLeft = Math.max(1, width - price.length - 1);
  let label = left.trim();
  if (label.length > maxLeft) {
    label = `${label.slice(0, Math.max(1, maxLeft - 1))}…`;
  }
  const pad = Math.max(1, width - label.length - price.length);
  return `${label}${" ".repeat(pad)}${price}`;
}

function rule(): string {
  return "-".repeat(COL);
}

function isPlaceholderAddress(value: string | null | undefined): boolean {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  return (
    !v ||
    v === "à préciser" ||
    v === "a preciser" ||
    v === "n/a" ||
    v === "-"
  );
}

function shopFooterAddress(restaurant: {
  address: string;
  postalCode: string;
  city: string;
}): string {
  if (!isPlaceholderAddress(restaurant.address)) {
    const cityLine = `${restaurant.postalCode} ${restaurant.city}`.trim();
    return cityLine
      ? `${restaurant.address}, ${cityLine}`
      : restaurant.address;
  }
  return SHOP_FOOTER_ADDRESS;
}

function normalizeBrandName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
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

  const brand = "Sushi D'or";
  const customer =
    `${order.customerFirstName} ${order.customerLastName}`.trim() || "Client";

  // Size hierarchy without heavy bold (em) — lighter stroke on thermal ink.
  const parts: string[] = [];
  parts.push(`<text lang="fr" font="font_a" em="false"/>`);

  // Header — brand only (address goes to footer)
  parts.push(`<text align="center" width="2" height="2"/>`);
  parts.push(line(brand));
  parts.push(`<text width="1" height="1"/>`);
  if (order.restaurant.phone) parts.push(line(order.restaurant.phone));

  // Order meta
  parts.push(`<feed unit="12"/>`);
  parts.push(`<text align="center" width="2" height="2"/>`);
  parts.push(line(`#${order.orderNumber}`));
  parts.push(`<text width="1" height="2"/>`);
  parts.push(line(orderTypeLabel(order.type)));
  parts.push(`<text width="1" height="1"/>`);
  parts.push(line(whenFr));

  // Customer — tall, regular weight
  parts.push(`<text align="left"/>`);
  parts.push(line(rule()));
  parts.push(`<text width="1" height="2"/>`);
  parts.push(line(customer));
  parts.push(`<text width="1" height="1"/>`);
  parts.push(line(order.customerPhone));
  if (order.type === "DELIVERY") {
    parts.push(line("LIVRAISON"));
    if (order.deliveryStreet) parts.push(line(order.deliveryStreet));
    if (order.deliveryComplement) parts.push(line(order.deliveryComplement));
    parts.push(
      line(
        `${order.deliveryPostalCode ?? ""} ${order.deliveryCity ?? ""}`.trim(),
      ),
    );
    if (order.deliveryNotes) parts.push(line(`Note: ${order.deliveryNotes}`));
  }

  // Items — taller, regular weight, price same line
  parts.push(line(rule()));
  for (const item of order.items) {
    parts.push(`<text width="1" height="2"/>`);
    parts.push(
      line(
        pairLine(
          `${item.quantity} x ${item.productNameSnapshot}`,
          formatEuro(item.lineTotalCents),
        ),
      ),
    );
    parts.push(`<text width="1" height="1"/>`);
    for (const a of item.addons) {
      const addonLeft = `   ${a.addonNameSnapshot}`;
      const addonRight =
        a.priceSnapshot > 0 ? `+${formatEuro(a.priceSnapshot)}` : "";
      parts.push(
        line(addonRight ? pairLine(addonLeft, addonRight) : addonLeft),
      );
    }
  }

  // Totals
  parts.push(line(rule()));
  parts.push(`<text width="1" height="1"/>`);
  parts.push(
    line(pairLine("Sous-total", formatEuro(order.productsSubtotalCents))),
  );
  if (order.addonsSubtotalCents > 0) {
    parts.push(
      line(pairLine("Options", formatEuro(order.addonsSubtotalCents))),
    );
  }
  if (order.deliveryFeeCents > 0) {
    parts.push(
      line(pairLine("Livraison", formatEuro(order.deliveryFeeCents))),
    );
  }
  if (order.discountCents > 0) {
    parts.push(
      line(pairLine("Remise", `-${formatEuro(order.discountCents)}`)),
    );
  }
  parts.push(`<text width="1" height="2"/>`);
  parts.push(line(pairLine("TOTAL", formatEuro(order.totalCents))));
  parts.push(`<text width="1" height="1"/>`);
  parts.push(line("Paye - Stripe"));

  if (order.notes) {
    parts.push(line(rule()));
    parts.push(line(`Note: ${order.notes}`));
  }

  parts.push(`<feed unit="20"/>`);
  parts.push(`<text align="center"/>`);
  parts.push(line("Merci et bon appetit !"));
  parts.push(`<feed unit="10"/>`);
  parts.push(line(shopFooterAddress(order.restaurant)));
  parts.push(`<feed unit="36"/>`);
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

/** ESC/POS ticket (TCP 9100 fallback). */
export function buildEscPosBase64(order: OrderForPrint): string {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const push = (s: string | Uint8Array) => {
    chunks.push(typeof s === "string" ? enc.encode(s) : s);
  };
  const brand = "Sushi D'or";

  const customer =
    `${order.customerFirstName} ${order.customerLastName}`.trim() || "Client";

  push(new Uint8Array([0x1b, 0x40])); // init
  push(new Uint8Array([0x1b, 0x4d, 0x00])); // Font A
  push(new Uint8Array([0x1b, 0x45, 0x00])); // regular weight
  push(new Uint8Array([0x1b, 0x61, 0x01])); // center
  push(new Uint8Array([0x1d, 0x21, 0x11])); // double W+H
  push(`${brand}\n`);
  push(new Uint8Array([0x1d, 0x21, 0x00]));
  if (order.restaurant.phone) push(`${order.restaurant.phone}\n`);
  push(new Uint8Array([0x1d, 0x21, 0x11]));
  push(`#${order.orderNumber}\n`);
  push(new Uint8Array([0x1d, 0x21, 0x01])); // double height
  push(`${orderTypeLabel(order.type)}\n`);
  push(new Uint8Array([0x1d, 0x21, 0x00]));
  push(new Uint8Array([0x1b, 0x61, 0x00])); // left
  push(`${rule()}\n`);
  push(new Uint8Array([0x1d, 0x21, 0x01]));
  push(`${customer}\n`);
  push(new Uint8Array([0x1d, 0x21, 0x00]));
  push(`${order.customerPhone}\n`);
  push(`${rule()}\n`);
  for (const item of order.items) {
    push(new Uint8Array([0x1d, 0x21, 0x01]));
    push(
      `${pairLine(
        `${item.quantity} x ${item.productNameSnapshot}`,
        formatEuro(item.lineTotalCents),
      )}\n`,
    );
    push(new Uint8Array([0x1d, 0x21, 0x00]));
    for (const a of item.addons) {
      push(
        a.priceSnapshot > 0
          ? `${pairLine(`   ${a.addonNameSnapshot}`, `+${formatEuro(a.priceSnapshot)}`)}\n`
          : `   ${a.addonNameSnapshot}\n`,
      );
    }
  }
  push(`${rule()}\n`);
  push(
    `${pairLine("Sous-total", formatEuro(order.productsSubtotalCents))}\n`,
  );
  push(new Uint8Array([0x1d, 0x21, 0x11]));
  push(`${pairLine("TOTAL", formatEuro(order.totalCents), 24)}\n`);
  push(new Uint8Array([0x1d, 0x21, 0x00]));
  push("Paye - Stripe\n\n");
  push(new Uint8Array([0x1b, 0x61, 0x01]));
  push("Merci et bon appetit !\n");
  push(`${shopFooterAddress(order.restaurant)}\n\n\n`);
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
