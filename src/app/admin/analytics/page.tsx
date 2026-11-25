import Link from "next/link";
import { AnalyticsDateFilter } from "@/components/admin/AnalyticsDateFilter";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";
import {
  getTrafficRange,
  isValidYmd,
  parisDateString,
  shiftParisDate,
} from "@/lib/site-traffic";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ from?: string; to?: string }>;
};

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const today = parisDateString();
  const defaultFrom = shiftParisDate(today, -29);

  let from = isValidYmd(params.from) ? params.from : defaultFrom;
  let to = isValidYmd(params.to) ? params.to : today;
  if (from > to) {
    const tmp = from;
    from = to;
    to = tmp;
  }
  // Cap range end at today
  if (to > today) to = today;

  const since = new Date(`${from}T00:00:00.000Z`);
  const until = new Date(`${to}T23:59:59.999Z`);

  const [orders, reservations, traffic] = await Promise.all([
    prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: since, lte: until },
        deletedStatus: 0,
      },
      include: { items: true },
    }),
    prisma.reservation.count({
      where: {
        createdAt: { gte: since, lte: until },
        deletedStatus: 0,
      },
    }),
    getTrafficRange(from, to),
  ]);

  const revenue = orders.reduce((s, o) => s + o.totalCents, 0);
  const aov = orders.length ? Math.round(revenue / orders.length) : 0;
  const productCount = new Map<string, number>();
  for (const o of orders) {
    for (const item of o.items) {
      productCount.set(
        item.productNameSnapshot,
        (productCount.get(item.productNameSnapshot) || 0) + item.quantity,
      );
    }
  }
  const popular = [...productCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const dayCount = traffic.series.length;
  const periodLabel =
    from === defaultFrom && to === today
      ? "30 derniers jours"
      : `${from} → ${to}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#c4a35a]">
            {periodLabel}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl">
            Analytics
          </h1>
        </div>
        <Link href="/admin" className="text-xs text-[#c4a35a]">
          ← Dashboard
        </Link>
      </div>

      <AnalyticsDateFilter from={from} to={to} today={today} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {(
          [
            ["Visiteurs uniques", String(traffic.totals.uniqueVisitors)],
            ["Visites (pages)", String(traffic.totals.pageViews)],
            ["Jours", String(dayCount)],
            ["CA", formatEuro(revenue)],
            ["Commandes", String(orders.length)],
            ["Panier moyen", formatEuro(aov)],
            ["Réservations", String(reservations)],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="border border-[#c4a35a]/20 bg-[#12100e] p-4">
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#a89f8e]">
              {k}
            </p>
            <p className="mt-2 text-2xl text-[#e0c878]">{v}</p>
          </div>
        ))}
      </div>

      <section className="border border-[#c4a35a]/20 bg-[#12100e] p-4">
        <h2 className="text-[#f0e6c8]">Trafic par jour</h2>
        <p className="mt-1 text-xs text-[#a89f8e]">
          Uniques + visites · fuseau Europe/Paris · {dayCount} jour
          {dayCount > 1 ? "s" : ""}
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-[0.65rem] uppercase tracking-[0.12em] text-[#a89f8e]">
              <tr>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Visiteurs uniques</th>
                <th className="px-2 py-2">Visites</th>
              </tr>
            </thead>
            <tbody>
              {[...traffic.series].reverse().map((row) => (
                <tr key={row.date} className="border-t border-[#c4a35a]/15">
                  <td className="px-2 py-2 text-[#c4bbaa]">
                    {new Date(`${row.date}T12:00:00`).toLocaleDateString(
                      "fr-FR",
                      {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </td>
                  <td className="px-2 py-2 text-[#e0c878]">
                    {row.uniqueVisitors}
                  </td>
                  <td className="px-2 py-2">{row.pageViews}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-[#c4a35a]/20 bg-[#12100e] p-4">
        <h2 className="text-[#f0e6c8]">Produits populaires</h2>
        {popular.length === 0 ? (
          <p className="mt-3 text-sm text-[#a89f8e]">Pas encore de données.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {popular.map(([name, qty]) => (
              <li key={name} className="flex justify-between gap-3">
                <span>{name}</span>
                <span className="text-[#e0c878]">{qty}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
