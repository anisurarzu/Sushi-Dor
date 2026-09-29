import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/** Any back-office role may sign in (legacy ADMIN included). */
const STAFF_ROLES = new Set([
  "ADMIN",
  "SUPER_ADMIN",
  "MANAGER",
  "STAFF",
]);

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = String(body.email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user?.passwordHash || !user.isActive) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 },
      );
    }

    if (!STAFF_ROLES.has(String(user.role))) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 },
      );
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 },
      );
    }

    const raw = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(raw).digest("hex");
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set("sd_admin", tokenHash, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 },
      );
    }
    console.error("[admin/login]", e);
    return NextResponse.json(
      { error: "Connexion impossible." },
      { status: 500 },
    );
  }
}
