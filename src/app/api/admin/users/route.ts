import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { effectiveRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  password: z.string().min(8).max(128),
  role: z.enum(["SUPER_ADMIN", "MANAGER", "STAFF", "ADMIN"]),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const admin = await requireAdminApi("users.view");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const users = await prisma.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "MANAGER", "STAFF", "ADMIN"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const admin = await requireAdminApi("users.create");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = createSchema.parse(await req.json());
  const actorRole = effectiveRole(admin.role);

  if (
    (body.role === "SUPER_ADMIN" || body.role === "ADMIN") &&
    actorRole !== "SUPER_ADMIN" &&
    admin.role !== "ADMIN"
  ) {
    return NextResponse.json(
      { error: "Seul un SUPER_ADMIN peut créer un SUPER_ADMIN." },
      { status: 403 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
  });
  if (existing) {
    return NextResponse.json({ error: "Email déjà utilisé." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: {
      email: body.email.toLowerCase(),
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone || null,
      role: body.role === "ADMIN" ? "SUPER_ADMIN" : body.role,
      passwordHash,
      isActive: body.isActive ?? true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
    },
  });

  await writeAudit({
    userId: admin.id,
    action: "user.create",
    entity: "User",
    entityId: user.id,
    meta: { email: user.email, role: user.role },
  });

  return NextResponse.json({ ok: true, user });
}
