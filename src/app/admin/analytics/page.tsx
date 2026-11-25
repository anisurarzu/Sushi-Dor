import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";
import { getTrafficSummary } from "@/lib/site-traffic";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [orders, reservations, traffic] = await Promise.all([
    prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: since },
        deletedStatus: 0,
      },
      include: { items: true },
    }),
    prisma.reservation.count({
      where: { createdAt: { gte: since }, deletedStatus: 0 },
    }),
    getTrafficSummary(30),
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

  const maxVisitors = Math.max(
    1,
    ...traffic.series.map((r) => r.uniqueVisitors),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#c4a35a]">
            30 jours
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl">
            Analytics
          </h1>
        </div>
        <Link href="/admin" className="text-xs text-[#c4a35a]">
          ← Dashboard
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {(
          [
            ["Visiteurs du jour", String(traffic.today.uniqueVisitors)],
            ["Pages vues du jour", String(traffic.today.pageViews)],
            ["Visiteurs 30 j", String(traffic.totals.uniqueVisitors)],
            ["Pages vues 30 j", String(traffic.totals.pageViews)],
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
        <h2 className="text-[#f0e6c8]">Visiteurs par jour</h2>
        <p className="mt-1 text-xs text-[#a89f8e]">
          Visiteurs uniques (cookie) · fuseau Europe/Paris
        </p>
        <ul className="mt-4 space-y-2">
          {[...traffic.series].reverse().map((row) => (
            <li key={row.date} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm">
              <span className="text-[#c4bbaa]">
                {new Date(`${row.date}T12:00:00`).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
              <div className="h-2 overflow-hidden bg-[#1a1612]">
                <div
                  className="h-full bg-gradient-to-r from-[#8a6f2f] to-[#e0c878]"
                  style={{
                    width: `${Math.round((row.uniqueVisitors / maxVisitors) * 100)}%`,
                  }}
                />
              </div>
              <span className="min-w-[4.5rem] text-right text-[#e0c878]">
                {row.uniqueVisitors}
                <span className="ml-2 text-[#a89f8e]">/ {row.pageViews}</span>
              </span>
            </li>
          ))}
        </ul>
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
