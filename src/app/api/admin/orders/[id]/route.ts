import { NextResponse } from "next/server";
import { z } from "zod";
import type { OrderStatus } from "@prisma/client";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "PAID",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "COMPLETED",
    "CANCELLED",
    "REFUNDED",
  ]),
  confirm: z.boolean().optional(),
});

const FLOW: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
];

function isRegression(from: OrderStatus, to: OrderStatus) {
  if (to === "CANCELLED" || to === "REFUNDED") return false;
  const a = FLOW.indexOf(from);
  const b = FLOW.indexOf(to);
  if (a < 0 || b < 0) return false;
  return b < a;
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const admin = await requireAdminApi("orders.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const body = schema.parse(await req.json());
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (isRegression(order.status, body.status) && !body.confirm) {
    return NextResponse.json(
      {
        error: "Transition inversée. Confirmez pour continuer.",
        requiresConfirm: true,
      },
      { status: 409 },
    );
  }

  if (body.status === "CANCELLED" && !body.confirm) {
    return NextResponse.json(
      {
        error: "Confirmez l'annulation de la commande.",
        requiresConfirm: true,
      },
      { status: 409 },
    );
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: body.status },
  });

  await writeAudit({
    userId: admin.id,
    action: "order.status_change",
    entity: "Order",
    entityId: id,
    meta: { from: order.status, to: body.status },
  });

  return NextResponse.json({ ok: true, order: updated });
}
