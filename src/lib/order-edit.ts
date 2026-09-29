import { prisma } from "@/lib/prisma";
import {
  priceProductLine,
  PricingError,
  type ProductForPricing,
} from "@/lib/pricing";
import type { Prisma } from "@prisma/client";

export type OrderEditItemInput = {
  /** Existing order item id — omit when adding new */
  id?: string;
  productId: string;
  quantity: number;
  addonIds: string[];
};

export type OrderEditPayload = {
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  customerEmail?: string;
  type?: "DELIVERY" | "TAKEAWAY" | "DINE_IN";
  restaurantId?: string;
  deliveryStreet?: string | null;
  deliveryComplement?: string | null;
  deliveryPostalCode?: string | null;
  deliveryCity?: string | null;
  notes?: string | null;
  deliveryFeeCents?: number;
  discountCents?: number;
  discountCode?: string | null;
  estimatedReadyAt?: string | null;
  items?: OrderEditItemInput[];
  adjustmentNote?: string;
};

async function loadProductForPricing(
  productId: string,
): Promise<ProductForPricing> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      addonGroups: {
        include: { addons: true },
      },
    },
  });
  if (!product) {
    throw new PricingError("Produit introuvable.", "PRODUCT_UNAVAILABLE");
  }
  return {
    id: product.id,
    nameFr: product.nameFr,
    priceCents: product.priceCents,
    isAvailable: true, // admin may add even if temporarily unavailable
    addonGroups: product.addonGroups.map((g) => ({
      id: g.id,
      nameFr: g.nameFr,
      selectionType: g.selectionType,
      required: g.required,
      minSelections: g.minSelections,
      maxSelections: g.maxSelections,
      isActive: g.isActive,
      addons: g.addons.map((a) => ({
        id: a.id,
        nameFr: a.nameFr,
        priceCents: a.priceCents,
        isActive: a.isActive,
      })),
    })),
  };
}

function recalculateTotals(input: {
  items: { lineTotalCents: number; basePriceSnapshot: number; quantity: number; addonsUnit?: number }[];
  deliveryFeeCents: number;
  discountCents: number;
}) {
  let productsSubtotal = 0;
  let addonsSubtotal = 0;
  for (const item of input.items) {
    productsSubtotal += item.basePriceSnapshot * item.quantity;
    addonsSubtotal +=
      item.lineTotalCents - item.basePriceSnapshot * item.quantity;
  }
  const subtotal = productsSubtotal + addonsSubtotal;
  const discount = Math.max(0, Math.min(input.discountCents, subtotal));
  const total = Math.max(0, subtotal + input.deliveryFeeCents - discount);
  return {
    productsSubtotalCents: productsSubtotal,
    addonsSubtotalCents: addonsSubtotal,
    subtotalCents: subtotal,
    discountCents: discount,
    deliveryFeeCents: input.deliveryFeeCents,
    totalCents: total,
  };
}

export async function applyOrderEdit(
  orderId: string,
  payload: OrderEditPayload,
  adminId: string,
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { addons: true } },
      payments: true,
    },
  });
  if (!order) throw new Error("Commande introuvable");

  const changes: { action: string; oldValue?: unknown; newValue?: unknown }[] =
    [];

  return prisma.$transaction(async (tx) => {
    let workingItems = order.items;

    if (payload.items) {
      // Replace items entirely with priced snapshots (new items use current prices;
      // existing items that keep same product+addons can preserve snapshots if quantity-only change)
      const pricedRows: {
        productId: string;
        productNameSnapshot: string;
        basePriceSnapshot: number;
        unitPriceSnapshot: number;
        quantity: number;
        lineTotalCents: number;
        addons: {
          addonId: string;
          addonNameSnapshot: string;
          priceSnapshot: number;
          quantity: number;
          lineTotalCents: number;
        }[];
      }[] = [];

      for (const item of payload.items) {
        const existing = item.id
          ? order.items.find((i) => i.id === item.id)
          : undefined;

        // Quantity-only on same product: preserve historical unit/addon prices
        const sameAddons =
          existing &&
          existing.productId === item.productId &&
          [...existing.addons.map((a) => a.addonId).filter(Boolean)].sort().join() ===
            [...item.addonIds].sort().join();

        if (existing && sameAddons) {
          const unit = existing.unitPriceSnapshot;
          const line = unit * item.quantity;
          pricedRows.push({
            productId: item.productId,
            productNameSnapshot: existing.productNameSnapshot,
            basePriceSnapshot: existing.basePriceSnapshot,
            unitPriceSnapshot: unit,
            quantity: item.quantity,
            lineTotalCents: line,
            addons: existing.addons.map((a) => ({
              addonId: a.addonId || "",
              addonNameSnapshot: a.addonNameSnapshot,
              priceSnapshot: a.priceSnapshot,
              quantity: a.quantity,
              lineTotalCents: a.priceSnapshot * a.quantity * item.quantity,
            })),
          });
          if (existing.quantity !== item.quantity) {
            changes.push({
              action: "item.quantity",
              oldValue: {
                name: existing.productNameSnapshot,
                qty: existing.quantity,
              },
              newValue: {
                name: existing.productNameSnapshot,
                qty: item.quantity,
              },
            });
          }
        } else {
          const product = await loadProductForPricing(item.productId);
          const priced = priceProductLine(product, item.addonIds, item.quantity);
          pricedRows.push({
            productId: priced.productId,
            productNameSnapshot: priced.productNameFr,
            basePriceSnapshot: priced.basePriceCents,
            unitPriceSnapshot: priced.unitPriceCents,
            quantity: priced.quantity,
            lineTotalCents: priced.lineTotalCents,
            addons: priced.addons.map((a) => ({
              addonId: a.addonId,
              addonNameSnapshot: a.nameFr,
              priceSnapshot: a.priceCents,
              quantity: 1,
              lineTotalCents: a.priceCents * priced.quantity,
            })),
          });
          changes.push({
            action: existing ? "item.update" : "item.add",
            oldValue: existing
              ? {
                  name: existing.productNameSnapshot,
                  qty: existing.quantity,
                }
              : undefined,
            newValue: {
              name: priced.productNameFr,
              qty: priced.quantity,
              addons: priced.addons.map((a) => a.nameFr),
            },
          });
        }
      }

      // Detect removals
      for (const old of order.items) {
        if (!payload.items.some((i) => i.id === old.id)) {
          changes.push({
            action: "item.remove",
            oldValue: {
              name: old.productNameSnapshot,
              qty: old.quantity,
            },
          });
        }
      }

      await tx.orderItemAddon.deleteMany({
        where: { orderItemId: { in: order.items.map((i) => i.id) } },
      });
      await tx.orderItem.deleteMany({ where: { orderId } });

      for (const row of pricedRows) {
        await tx.orderItem.create({
          data: {
            orderId,
            productId: row.productId,
            productNameSnapshot: row.productNameSnapshot,
            basePriceSnapshot: row.basePriceSnapshot,
            unitPriceSnapshot: row.unitPriceSnapshot,
            quantity: row.quantity,
            lineTotalCents: row.lineTotalCents,
            addons: {
              create: row.addons
                .filter((a) => a.addonId)
                .map((a) => ({
                  addonId: a.addonId,
                  addonNameSnapshot: a.addonNameSnapshot,
                  priceSnapshot: a.priceSnapshot,
                  quantity: a.quantity,
                  lineTotalCents: a.lineTotalCents,
                })),
            },
          },
        });
      }

      workingItems = await tx.orderItem.findMany({
        where: { orderId },
        include: { addons: true },
      });
    }

    const deliveryFeeCents =
      payload.deliveryFeeCents !== undefined
        ? payload.deliveryFeeCents
        : order.deliveryFeeCents;
    const discountCents =
      payload.discountCents !== undefined
        ? payload.discountCents
        : order.discountCents;

    if (
      payload.deliveryFeeCents !== undefined &&
      payload.deliveryFeeCents !== order.deliveryFeeCents
    ) {
      changes.push({
        action: "delivery_fee",
        oldValue: order.deliveryFeeCents,
        newValue: payload.deliveryFeeCents,
      });
    }
    if (
      payload.discountCents !== undefined &&
      payload.discountCents !== order.discountCents
    ) {
      changes.push({
        action: "discount",
        oldValue: order.discountCents,
        newValue: payload.discountCents,
      });
    }

    const totals = recalculateTotals({
      items: workingItems.map((i) => ({
        lineTotalCents: i.lineTotalCents,
        basePriceSnapshot: i.basePriceSnapshot,
        quantity: i.quantity,
      })),
      deliveryFeeCents,
      discountCents,
    });

    const data: Prisma.OrderUpdateInput = {
      ...totals,
    };

    if (payload.customerFirstName !== undefined) {
      data.customerFirstName = payload.customerFirstName;
      if (payload.customerFirstName !== order.customerFirstName) {
        changes.push({
          action: "customer.firstName",
          oldValue: order.customerFirstName,
          newValue: payload.customerFirstName,
        });
      }
    }
    if (payload.customerLastName !== undefined) {
      data.customerLastName = payload.customerLastName;
    }
    if (payload.customerPhone !== undefined) {
      data.customerPhone = payload.customerPhone;
    }
    if (payload.customerEmail !== undefined) {
      data.customerEmail = payload.customerEmail;
    }
    if (payload.type !== undefined) {
      data.type = payload.type;
      if (payload.type !== order.type) {
        changes.push({
          action: "type",
          oldValue: order.type,
          newValue: payload.type,
        });
      }
    }
    if (payload.restaurantId !== undefined) {
      data.restaurant = { connect: { id: payload.restaurantId } };
    }
    if (payload.deliveryStreet !== undefined) {
      data.deliveryStreet = payload.deliveryStreet;
    }
    if (payload.deliveryComplement !== undefined) {
      data.deliveryComplement = payload.deliveryComplement;
    }
    if (payload.deliveryPostalCode !== undefined) {
      data.deliveryPostalCode = payload.deliveryPostalCode;
    }
    if (payload.deliveryCity !== undefined) {
      data.deliveryCity = payload.deliveryCity;
    }
    if (payload.notes !== undefined) {
      data.notes = payload.notes;
    }
    if (payload.discountCode !== undefined) {
      data.discountCode = payload.discountCode;
    }
    if (payload.estimatedReadyAt !== undefined) {
      data.estimatedReadyAt = payload.estimatedReadyAt
        ? new Date(payload.estimatedReadyAt)
        : null;
    }

    const previousTotal = order.totalCents;
    const updated = await tx.order.update({
      where: { id: orderId },
      data,
      include: {
        items: { include: { addons: true } },
        adjustments: true,
      },
    });

    const delta = updated.totalCents - previousTotal;
    let paymentWarning: string | null = null;

    if (
      (order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_REFUNDED") &&
      delta !== 0
    ) {
      paymentWarning =
        delta > 0
          ? `Le montant payé est inférieur au nouveau total de ${formatDelta(delta)}.`
          : `Le nouveau total est inférieur de ${formatDelta(-delta)} au montant payé.`;

      await tx.orderAdjustment.create({
        data: {
          orderId,
          kind: delta > 0 ? "UNDERPAID" : "OVERPAID",
          amountCents: delta,
          note:
            payload.adjustmentNote ||
            paymentWarning,
          createdById: adminId,
        },
      });
      changes.push({
        action: "payment_adjustment",
        oldValue: previousTotal,
        newValue: updated.totalCents,
      });
    }

    for (const change of changes) {
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: `order.${change.action}`,
          entity: "Order",
          entityId: orderId,
          meta: JSON.parse(
            JSON.stringify({
              oldValue: change.oldValue,
              newValue: change.newValue,
            }),
          ) as object,
        },
      });
    }

    return {
      order: updated,
      paymentWarning,
      delta,
      previousTotal,
    };
  });
}

function formatDelta(cents: number) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}
