import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const latest = await prisma.order.findFirst({
    where: { paymentStatus: "PAID" },
    orderBy: { createdAt: "desc" },
    select: { id: true, orderNumber: true, createdAt: true },
  });
  return NextResponse.json(latest ?? {});
}
