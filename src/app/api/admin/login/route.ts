import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = schema.parse(await req.json());
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user?.passwordHash || user.role !== "ADMIN") {
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
}
