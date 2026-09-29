import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z.string().max(40).nullable().optional(),
  email: z.string().email().optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const admin = await requireAdminApi("customers.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const body = schema.parse(await req.json());
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }
  const updated = await prisma.user.update({
    where: { id },
    data: body,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
  });
  await writeAudit({
    userId: admin.id,
    action: "customer.update",
    entity: "User",
    entityId: id,
    meta: body,
  });
  return NextResponse.json({ ok: true, user: updated });
}
