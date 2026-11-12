import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export const CUSTOMER_COOKIE = "sd_customer";
const SESSION_DAYS = 30;

export type CustomerUser = Pick<
  User,
  "id" | "email" | "firstName" | "lastName" | "phone" | "role" | "isActive"
>;

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createCustomerSession(userId: string) {
  const raw = randomBytes(32).toString("hex");
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * SESSION_DAYS,
  );

  await prisma.session.create({
    data: { userId, tokenHash, expiresAt },
  });

  return { tokenHash, expiresAt, maxAge: 60 * 60 * 24 * SESSION_DAYS };
}

export async function getCustomerUser(): Promise<CustomerUser | null> {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: token },
    include: { user: true },
  });

  if (
    !session ||
    session.expiresAt < new Date() ||
    session.user.role !== "CUSTOMER" ||
    !session.user.isActive ||
    session.user.deletedStatus === 255 ||
    !session.user.passwordHash
  ) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    phone: session.user.phone,
    role: session.user.role,
    isActive: session.user.isActive,
  };
}

export async function requireCustomerApi(): Promise<CustomerUser | null> {
  return getCustomerUser();
}

export async function destroyCustomerSession() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: token } });
  }
}
