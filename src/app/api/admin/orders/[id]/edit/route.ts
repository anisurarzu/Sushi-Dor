import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-auth";
import { applyOrderEdit, type OrderEditPayload } from "@/lib/order-edit";
import { PricingError } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

const itemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  addonIds: z.array(z.string()).default([]),
});

const schema = z.object({
  customerFirstName: z.string().min(1).max(80).optional(),
  customerLastName: z.string().min(1).max(80).optional(),
  customerPhone: z.string().min(6).max(40).optional(),
  customerEmail: z.string().email().optional(),
  type: z.enum(["DELIVERY", "TAKEAWAY", "DINE_IN"]).optional(),
  restaurantId: z.string().min(1).optional(),
  deliveryStreet: z.string().max(200).nullable().optional(),
  deliveryComplement: z.string().max(200).nullable().optional(),
  deliveryPostalCode: z.string().max(20).nullable().optional(),
  deliveryCity: z.string().max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  deliveryFeeCents: z.number().int().min(0).optional(),
  discountCents: z.number().int().min(0).optional(),
  discountCode: z.string().max(40).nullable().optional(),
  estimatedReadyAt: z.string().nullable().optional(),
  items: z.array(itemSchema).optional(),
  adjustmentNote: z.string().max(500).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const admin = await requireAdminApi("orders.view");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { OR: [{ id }, { orderNumber: id }] },
    include: {
      items: { include: { addons: true } },
      adjustments: { orderBy: { createdAt: "desc" } },
      payments: true,
      restaurant: true,
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }
  const logs = await prisma.auditLog.findMany({
    where: { entity: "Order", entityId: order.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ order, logs });
}

export async function PATCH(req: Request, { params }: Params) {
  const admin = await requireAdminApi("orders.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { OR: [{ id }, { orderNumber: id }] },
  });
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  try {
    const body = schema.parse(await req.json()) as OrderEditPayload;
    const result = await applyOrderEdit(order.id, body, admin.id);
    return NextResponse.json({
      ok: true,
      order: result.order,
      paymentWarning: result.paymentWarning,
      delta: result.delta,
      previousTotal: result.previousTotal,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message || "Données invalides" },
        { status: 400 },
      );
    }
    if (e instanceof PricingError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
