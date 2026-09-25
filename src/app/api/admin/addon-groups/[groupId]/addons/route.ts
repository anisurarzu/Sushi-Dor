import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function requireAdmin() {
  const jar = await cookies();
  const token = jar.get("sd_admin")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || session.user.role !== "ADMIN") {
    return null;
  }
  return session.user;
}

const schema = z.object({
  nameFr: z.string().min(1),
  priceCents: z.number().int().min(0),
});

type Params = { params: Promise<{ groupId: string }> };

export async function POST(req: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { groupId } = await params;
  const body = schema.parse(await req.json());
  const addon = await prisma.productAddon.create({
    data: {
      groupId,
      nameFr: body.nameFr,
      priceCents: body.priceCents,
    },
  });
  return NextResponse.json({ addon });
}
