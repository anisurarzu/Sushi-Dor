import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  CUSTOMER_COOKIE,
  createCustomerSession,
} from "@/lib/customer-auth";
import { CART_COOKIE } from "@/lib/cart";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (
      !user?.passwordHash ||
      !user.isActive ||
      user.deletedStatus === 255 ||
      user.role !== "CUSTOMER"
    ) {
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

    const session = await createCustomerSession(user.id);

    // Attach anonymous cart to this customer when possible
    try {
      const jar = await cookies();
      const cartToken = jar.get(CART_COOKIE)?.value;
      if (cartToken) {
        await prisma.cart.updateMany({
          where: { sessionToken: cartToken, userId: null },
          data: { userId: user.id },
        });
      }
    } catch {
      /* ignore */
    }

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
    });
    res.cookies.set(CUSTOMER_COOKIE, session.tokenHash, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: session.maxAge,
    });
    return res;
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 },
      );
    }
    console.error("[auth/login]", e);
    return NextResponse.json(
      { error: "Connexion impossible." },
      { status: 500 },
    );
  }
}
