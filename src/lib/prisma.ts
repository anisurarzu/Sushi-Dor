import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** True when DATABASE_URL points at a reachable remote host (not local laptop). */
export function isRemoteDatabase() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) return false;
  return !(
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("@localhost:") ||
    url.includes(":///") 
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function dbAvailable() {
  if (!hasDatabaseUrl()) return false;
  // On Vercel, never attempt laptop localhost
  if (process.env.VERCEL && !isRemoteDatabase()) return false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
