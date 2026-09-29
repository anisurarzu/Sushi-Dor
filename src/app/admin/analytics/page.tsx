import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const orders = await prisma.order.findMany({
    where: { paymentStatus: "PAID", createdAt: { gte: since } },
    include: { items: true },
  });
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
  const popular = [...productCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const reservations = await prisma.reservation.count({ where: { createdAt: { gte: since } } });
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#c4a35a]">30 jours</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl">Analytics</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["CA", formatEuro(revenue)],
          ["Commandes", String(orders.length)],
          ["Panier moyen", formatEuro(aov)],
          ["Réservations", String(reservations)],
        ].map(([k, v]) => (
          <div key={k} className="border border-[#c4a35a]/20 bg-[#12100e] p-4">
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#a89f8e]">{k}</p>
            <p className="mt-2 text-2xl text-[#e0c878]">{v}</p>
          </div>
        ))}
      </div>
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
