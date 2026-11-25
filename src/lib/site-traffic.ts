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

export function shiftParisDate(ymd: string, deltaDays: number) {
  const d = new Date(`${ymd}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidYmd(value: string | null | undefined): value is string {
  return Boolean(value && YMD_RE.test(value));
}

/** Inclusive daily series between from..to (YYYY-MM-DD, Europe/Paris calendar). */
export async function getTrafficRange(from: string, to: string) {
  let start = from;
  let end = to;
  if (start > end) {
    const tmp = start;
    start = end;
    end = tmp;
  }

  const rows = await prisma.siteTrafficDay.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
  });
  const byDate = new Map(rows.map((r) => [r.date, r]));

  const series: {
    date: string;
    pageViews: number;
    uniqueVisitors: number;
  }[] = [];

  let cursor = start;
  while (cursor <= end) {
    const row = byDate.get(cursor);
    series.push({
      date: cursor,
      pageViews: row?.pageViews ?? 0,
      uniqueVisitors: row?.uniqueVisitors ?? 0,
    });
    cursor = shiftParisDate(cursor, 1);
  }

  const [pageViews, uniqueVisitors] = await Promise.all([
    sumPageViews(start, end),
    countUniqueVisitors(start, end),
  ]);

  return {
    from: start,
    to: end,
    series,
    totals: { pageViews, uniqueVisitors },
  };
}

async function sumPageViews(from?: string, to?: string) {
  const where =
    from && to
      ? { date: { gte: from, lte: to } }
      : from
        ? { date: { gte: from } }
        : to
          ? { date: { lte: to } }
          : {};
  const agg = await prisma.siteTrafficDay.aggregate({
    where,
    _sum: { pageViews: true },
  });
  return agg._sum.pageViews ?? 0;
}

async function countUniqueVisitors(from?: string, to?: string) {
  const where =
    from && to
      ? { date: { gte: from, lte: to } }
      : from
        ? { date: { gte: from } }
        : to
          ? { date: { lte: to } }
          : {};
  const rows = await prisma.siteVisitorDay.findMany({
    where,
    select: { visitorHash: true },
    distinct: ["visitorHash"],
  });
  return rows.length;
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
  const from = shiftParisDate(today, -(days - 1));

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
    const key = shiftParisDate(from, i);
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

export async function getTrafficDashboardCards() {
  const today = parisDateString();
  const from7 = shiftParisDate(today, -6);
  const from30 = shiftParisDate(today, -29);

  const [
    todayViews,
    todayUniques,
    weekViews,
    weekUniques,
    monthViews,
    monthUniques,
    allViews,
    allUniques,
  ] = await Promise.all([
    sumPageViews(today, today),
    countUniqueVisitors(today, today),
    sumPageViews(from7, today),
    countUniqueVisitors(from7, today),
    sumPageViews(from30, today),
    countUniqueVisitors(from30, today),
    sumPageViews(),
    countUniqueVisitors(),
  ]);

  return {
    today: { uniqueVisitors: todayUniques, pageViews: todayViews },
    last7Days: { uniqueVisitors: weekUniques, pageViews: weekViews },
    lastMonth: { uniqueVisitors: monthUniques, pageViews: monthViews },
    allTime: { uniqueVisitors: allUniques, pageViews: allViews },
  };
}
