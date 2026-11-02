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

/** Neon pooler needs pgbouncer mode so Prisma does not keep dead prepared statements. */
function prismaDatasourceUrl() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    const isPooler =
      url.hostname.includes("-pooler") || url.hostname.includes("pooler");
    if (isPooler && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "15");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: prismaDatasourceUrl()
      ? { db: { url: prismaDatasourceUrl() } }
      : undefined,
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
