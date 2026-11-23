import { NextResponse } from "next/server";
import { getCustomerUser } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email-verification";

export const dynamic = "force-dynamic";

export async function POST() {
  const sessionUser = await getCustomerUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
  });
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  }

  if (user.emailVerifiedAt) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const result = await sendVerificationEmail(user);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Envoi impossible." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    skipped: Boolean(result.skipped),
  });
}
