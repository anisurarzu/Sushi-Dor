import { prisma } from "@/lib/prisma";

/** Paris date parts → compact prefix SD + DD + MM + YY (e.g. SD111026). */
export function orderNumberPrefix(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).formatToParts(date);
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const year = parts.find((p) => p.type === "year")?.value ?? "00";
  return `SD${day}${month}${year}`;
}

/**
 * Next daily sequence: SD11102601, SD11102602, …
 * (SD + day + month + year2 + seq)
 */
export async function nextOrderNumber(): Promise<string> {
  const prefix = orderNumberPrefix();
  const todays = await prisma.order.findMany({
    where: { orderNumber: { startsWith: prefix } },
    select: { orderNumber: true },
  });
  let max = 0;
  for (const o of todays) {
    const rest = o.orderNumber.slice(prefix.length);
    // Only count compact numeric tails (ignore old random codes)
    if (!/^\d+$/.test(rest)) continue;
    const n = Number.parseInt(rest, 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  for (let i = 1; i <= 30; i++) {
    const candidate = `${prefix}${String(max + i).padStart(2, "0")}`;
    const clash = await prisma.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  return `${prefix}${Date.now().toString(36).toUpperCase()}`;
}
