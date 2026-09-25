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
  selectionType: z.enum(["SINGLE", "MULTIPLE"]),
  required: z.boolean().default(false),
  minSelections: z.number().int().min(0).default(0),
  maxSelections: z.number().int().min(1).default(1),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const body = schema.parse(await req.json());
  const group = await prisma.productAddonGroup.create({
    data: {
      productId: id,
      nameFr: body.nameFr,
      selectionType: body.selectionType,
      required: body.required,
      minSelections: body.minSelections,
      maxSelections: body.maxSelections,
    },
  });
  return NextResponse.json({ group });
}
