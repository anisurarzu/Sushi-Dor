import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export function parisDateString(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function hashVisitorId(raw: string) {
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

export async function recordSiteVisit(visitorId: string) {
  const date = parisDateString();
  const visitorHash = hashVisitorId(visitorId.trim());
  if (!visitorHash) return null;

  const day = await prisma.siteTrafficDay.upsert({
    where: { date },
    create: { date, pageViews: 0, uniqueVisitors: 0 },
    update: {},
  });

  let isNewVisitor = false;
  try {
    await prisma.siteVisitorDay.create({
      data: { visitorHash, date },
    });
    isNewVisitor = true;
  } catch {
    // unique constraint → already counted today
  }

  return prisma.siteTrafficDay.update({
    where: { id: day.id },
    data: {
      pageViews: { increment: 1 },
      uniqueVisitors: isNewVisitor ? { increment: 1 } : undefined,
    },
  });
}

export async function getTrafficSummary(days = 14) {
  const today = parisDateString();
  const start = new Date(`${today}T12:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const from = start.toISOString().slice(0, 10);

  const rows = await prisma.siteTrafficDay.findMany({
    where: { date: { gte: from, lte: today } },
    orderBy: { date: "asc" },
  });

  const byDate = new Map(rows.map((r) => [r.date, r]));
  const series: {
    date: string;
    pageViews: number;
    uniqueVisitors: number;
  }[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(`${from}T12:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    const row = byDate.get(key);
    series.push({
      date: key,
      pageViews: row?.pageViews ?? 0,
      uniqueVisitors: row?.uniqueVisitors ?? 0,
    });
  }

  const todayRow = byDate.get(today);
  const totals = series.reduce(
    (acc, r) => {
      acc.pageViews += r.pageViews;
      acc.uniqueVisitors += r.uniqueVisitors;
      return acc;
    },
    { pageViews: 0, uniqueVisitors: 0 },
  );

  return {
    today: {
      date: today,
      pageViews: todayRow?.pageViews ?? 0,
      uniqueVisitors: todayRow?.uniqueVisitors ?? 0,
    },
    periodDays: days,
    totals,
    series,
  };
}
