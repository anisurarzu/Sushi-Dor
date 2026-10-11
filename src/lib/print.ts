import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";
import type { PrintJob } from "@prisma/client";

/** 80mm Epson ≈ 42 cols at 1× width; keep 40 for padding. */
const COL = 40;

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

function thinRule(): string {
  return "-".repeat(COL);
}

function shortName(first: string, last: string): string {
  const f = first.trim();
  const l = last.trim();
  if (!f && !l) return "Client";
  if (!l) return f;
  return `${f} ${l.charAt(0).toUpperCase()}.`;
}

function isPlaceholderAddress(value: string | null | undefined): boolean {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  return !v || v === "à préciser" || v === "a preciser" || v === "n/a" || v === "-";
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

/**
 * Kitchen ticket — Uber Eats–style hierarchy (no QR):
 * brand + type · inverted name/order# · bold items · bold total
 */
export function buildEposXml(order: OrderForPrint): string {
  const when = order.paidAt ?? order.createdAt;
  const whenFr = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(when);

  const customer = shortName(order.customerFirstName, order.customerLastName);
  const typeLabel = orderTypeLabel(order.type);
  const parts: string[] = [];

  parts.push(`<text lang="fr"/>`);
  parts.push(`<text align="left"/>`);

  // Top: brand left + order type right (Uber-style)
  parts.push(`<text width="1" height="2" em="true"/>`);
  parts.push(line(pairLine("SUSHI D'OR", typeLabel)));
  parts.push(`<text width="1" height="1" em="false"/>`);
  if (!isPlaceholderAddress(order.restaurant.address)) {
    parts.push(line(order.restaurant.address));
  }
  parts.push(
    line(`${order.restaurant.postalCode} ${order.restaurant.city}`.trim()),
  );

  // Inverted banner: customer + order number (Uber-style highlight)
  parts.push(`<feed unit="12"/>`);
  parts.push(`<text reverse="true" width="1" height="2" em="true"/>`);
  parts.push(line(pairLine(customer, `#${order.orderNumber}`)));
  parts.push(`<text reverse="false" width="1" height="1" em="false"/>`);
  parts.push(line(`Tel: ${order.customerPhone}`));
  if (order.type === "DELIVERY") {
    if (order.deliveryStreet) parts.push(line(order.deliveryStreet));
    parts.push(
      line(
        `${order.deliveryPostalCode ?? ""} ${order.deliveryCity ?? ""}`.trim(),
      ),
    );
  }

  parts.push(line(thinRule()));

  // Items — larger bold lines, price same row
  for (const item of order.items) {
    parts.push(`<text width="1" height="2" em="true"/>`);
    parts.push(
      line(
        pairLine(
          `${item.quantity} x ${item.productNameSnapshot}`,
          formatEuro(item.lineTotalCents),
        ),
      ),
    );
    parts.push(`<text width="1" height="1" em="false"/>`);
    for (const a of item.addons) {
      const left = `  ${a.quantity > 1 ? `${a.quantity}x ` : ""}${a.addonNameSnapshot}`;
      const right =
        a.priceSnapshot > 0 ? formatEuro(a.priceSnapshot) : "";
      parts.push(line(right ? pairLine(left, right) : left));
    }
  }

  parts.push(line(thinRule()));

  // Totals
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

  parts.push(`<feed unit="8"/>`);
  parts.push(`<text width="1" height="2" em="true"/>`);
  parts.push(line(pairLine("Montant paye", formatEuro(order.totalCents))));
  parts.push(`<text width="1" height="1" em="false"/>`);
  parts.push(line("Paye - Stripe"));

  if (order.notes) {
    parts.push(line(thinRule()));
    parts.push(line(`Note: ${order.notes}`));
  }
  if (order.deliveryNotes) {
    parts.push(line(`Livraison: ${order.deliveryNotes}`));
  }

  parts.push(line(thinRule()));
  parts.push(line(`Effectuee le ${whenFr}`));
  parts.push(`<feed unit="16"/>`);
  parts.push(`<text align="center"/>`);
  parts.push(line("Merci pour votre commande"));
  parts.push(line("Sushi D'or"));
  parts.push(`<feed unit="40"/>`);
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

/** ESC/POS fallback — same hierarchy (reverse banner + large total). */
export function buildEscPosBase64(order: OrderForPrint): string {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const push = (s: string | Uint8Array) => {
    chunks.push(typeof s === "string" ? enc.encode(s) : s);
  };

  const when = order.paidAt ?? order.createdAt;
  const whenFr = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(when);
  const customer = shortName(order.customerFirstName, order.customerLastName);
  const typeLabel = orderTypeLabel(order.type);

  push(new Uint8Array([0x1b, 0x40])); // init
  push(new Uint8Array([0x1b, 0x61, 0x00])); // left
  push(new Uint8Array([0x1d, 0x21, 0x11])); // double W+H
  push(`${pairLine("SUSHI D'OR", typeLabel, 24)}\n`);
  push(new Uint8Array([0x1d, 0x21, 0x00]));
  if (!isPlaceholderAddress(order.restaurant.address)) {
    push(`${order.restaurant.address}\n`);
  }
  push(`${order.restaurant.postalCode} ${order.restaurant.city}\n`);

  // Reverse banner
  push(new Uint8Array([0x1d, 0x42, 0x01])); // reverse on
  push(new Uint8Array([0x1d, 0x21, 0x11]));
  push(`${pairLine(customer, `#${order.orderNumber}`, 24)}\n`);
  push(new Uint8Array([0x1d, 0x21, 0x00]));
  push(new Uint8Array([0x1d, 0x42, 0x00])); // reverse off
  push(`Tel: ${order.customerPhone}\n`);
  if (order.type === "DELIVERY") {
    if (order.deliveryStreet) push(`${order.deliveryStreet}\n`);
    const cityLine =
      `${order.deliveryPostalCode ?? ""} ${order.deliveryCity ?? ""}`.trim();
    if (cityLine) push(`${cityLine}\n`);
  }
  push(`${thinRule()}\n`);

  for (const item of order.items) {
    push(new Uint8Array([0x1d, 0x21, 0x01])); // double height
    push(
      `${pairLine(
        `${item.quantity} x ${item.productNameSnapshot}`,
        formatEuro(item.lineTotalCents),
      )}\n`,
    );
    push(new Uint8Array([0x1d, 0x21, 0x00]));
    for (const a of item.addons) {
      const left = `  ${a.quantity > 1 ? `${a.quantity}x ` : ""}${a.addonNameSnapshot}`;
      push(
        a.priceSnapshot > 0
          ? `${pairLine(left, formatEuro(a.priceSnapshot))}\n`
          : `${left}\n`,
      );
    }
  }

  push(`${thinRule()}\n`);
  push(`${pairLine("Sous-total", formatEuro(order.productsSubtotalCents))}\n`);
  if (order.addonsSubtotalCents > 0) {
    push(`${pairLine("Options", formatEuro(order.addonsSubtotalCents))}\n`);
  }
  if (order.deliveryFeeCents > 0) {
    push(`${pairLine("Livraison", formatEuro(order.deliveryFeeCents))}\n`);
  }
  if (order.discountCents > 0) {
    push(`${pairLine("Remise", `-${formatEuro(order.discountCents)}`)}\n`);
  }
  push(new Uint8Array([0x1d, 0x21, 0x11]));
  push(`${pairLine("Montant paye", formatEuro(order.totalCents), 24)}\n`);
  push(new Uint8Array([0x1d, 0x21, 0x00]));
  push("Paye - Stripe\n");
  if (order.notes) push(`Note: ${order.notes}\n`);
  push(`${thinRule()}\n`);
  push(`Effectuee le ${whenFr}\n`);
  push(new Uint8Array([0x1b, 0x61, 0x01]));
  push("Merci pour votre commande\nSushi D'or\n\n\n");
  push(new Uint8Array([0x1d, 0x56, 0x00]));

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
