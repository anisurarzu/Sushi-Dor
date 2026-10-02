import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertPrintAgent } from "@/lib/print-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Agent polls for pending print jobs.
 * GET /api/print/jobs?limit=5&restaurantId=optional
 * Header: x-print-agent-secret: <PRINT_AGENT_SECRET>
 */
export async function GET(req: Request) {
  const denied = assertPrintAgent(req);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") || 5)));
  const restaurantId = searchParams.get("restaurantId") || undefined;

  // Re-queue stale CLAIMED jobs (>2 min) so a crashed agent can retry
  const staleBefore = new Date(Date.now() - 2 * 60 * 1000);
  await prisma.printJob.updateMany({
    where: {
      status: "CLAIMED",
      claimedAt: { lt: staleBefore },
    },
    data: { status: "PENDING", claimedAt: null },
  });

  const jobs = await prisma.printJob.findMany({
    where: {
      status: "PENDING",
      ...(restaurantId ? { restaurantId } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      orderId: true,
      restaurantId: true,
      kind: true,
      status: true,
      eposXml: true,
      escposBase64: true,
      attempts: true,
      createdAt: true,
      order: {
        select: {
          orderNumber: true,
          type: true,
          totalCents: true,
          productsSubtotalCents: true,
          addonsSubtotalCents: true,
          deliveryFeeCents: true,
          discountCents: true,
          customerFirstName: true,
          customerLastName: true,
          customerPhone: true,
          deliveryStreet: true,
          deliveryComplement: true,
          deliveryPostalCode: true,
          deliveryCity: true,
          deliveryNotes: true,
          notes: true,
          paidAt: true,
          createdAt: true,
          restaurant: {
            select: {
              name: true,
              address: true,
              postalCode: true,
              city: true,
              phone: true,
            },
          },
          items: {
            select: {
              productNameSnapshot: true,
              quantity: true,
              unitPriceSnapshot: true,
              lineTotalCents: true,
              addons: {
                select: {
                  addonNameSnapshot: true,
                  quantity: true,
                  priceSnapshot: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ jobs });
}
