import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";
import { getTrafficSummary } from "@/lib/site-traffic";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

export const dynamic = "force-dynamic";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const today = startOfToday();

  const [
    todayPaidOrders,
    pendingOrders,
    todayReservations,
    activeProducts,
    customers,
    recentOrders,
    traffic,
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        deletedStatus: 0,
        paymentStatus: "PAID",
        createdAt: { gte: today },
      },
      select: { totalCents: true },
    }),
    prisma.order.count({
      where: {
        deletedStatus: 0,
        paymentStatus: "PAID",
        status: { in: ["PAID", "CONFIRMED", "PREPARING", "READY"] },
      },
    }),
    prisma.reservation.count({
      where: { date: today, deletedStatus: 0 },
    }),
    prisma.product.count({
      where: { isAvailable: true, deletedStatus: 0 },
    }),
    prisma.user.count({
      where: { role: "CUSTOMER", deletedStatus: 0 },
    }),
    prisma.order.findMany({
      where: { deletedStatus: 0 },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { items: true },
    }),
    getTrafficSummary(7),
  ]);

  const revenue = todayPaidOrders.reduce((s, o) => s + o.totalCents, 0);
  const ordersToday = todayPaidOrders.length;

  const cards = [
    {
      label: "Visiteurs du jour",
      value: String(traffic.today.uniqueVisitors),
      hint: "Personnes uniques",
    },
    {
      label: "Visites du jour",
      value: String(traffic.today.pageViews),
      hint: "Nombre de fois (pages)",
    },
    { label: "CA du jour", value: formatEuro(revenue) },
    { label: "Commandes du jour", value: String(ordersToday) },
    { label: "En cours", value: String(pendingOrders) },
    { label: "Réservations du jour", value: String(todayReservations) },
    { label: "Produits actifs", value: String(activeProducts) },
    { label: "Clients", value: String(customers) },
    {
      label: "Visiteurs 7 jours",
      value: String(traffic.totals.uniqueVisitors),
      hint: "Personnes uniques",
    },
    {
      label: "Visites 7 jours",
      value: String(traffic.totals.pageViews),
      hint: "Nombre de fois (pages)",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#c4a35a]">
            Vue d&apos;ensemble
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[#f0e6c8]">
            Dashboard
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products/new" className="btn-gold px-3 py-2 text-[0.65rem]">
            Ajouter un produit
          </Link>
          <Link
            href="/admin/categories"
            className="btn-ghost px-3 py-2 text-[0.65rem]"
          >
            Catégories
          </Link>
          <Link
            href="/admin/orders"
            className="btn-ghost px-3 py-2 text-[0.65rem]"
          >
            Commandes
          </Link>
          <AdminLogoutButton />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="border border-[#c4a35a]/25 bg-[#12100e] p-4"
          >
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#a89f8e]">
              {card.label}
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[#e0c878]">
              {card.value}
            </p>
            {"hint" in card && card.hint ? (
              <p className="mt-1 text-xs text-[#a89f8e]">{card.hint}</p>
            ) : null}
          </div>
        ))}
      </div>

      <section className="border border-[#c4a35a]/20 bg-[#12100e] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[#f0e6c8]">
            Visites — 7 derniers jours
          </h2>
          <Link href="/admin/analytics" className="text-xs text-[#c4a35a]">
            Analytics →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="text-[0.65rem] uppercase tracking-[0.12em] text-[#a89f8e]">
              <tr>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Visiteurs</th>
                <th className="px-2 py-2">Visites</th>
              </tr>
            </thead>
            <tbody>
              {[...traffic.series].reverse().map((row) => (
                <tr
                  key={row.date}
                  className="border-t border-[#c4a35a]/15"
                >
                  <td className="px-2 py-2 text-[#c4bbaa]">
                    {new Date(`${row.date}T12:00:00`).toLocaleDateString(
                      "fr-FR",
                      {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
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

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[#f0e6c8]">
            Commandes récentes
          </h2>
          <Link href="/admin/orders" className="text-xs text-[#c4a35a]">
            Tout voir
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="border border-[#c4a35a]/20 p-6 text-sm text-[#a89f8e]">
            Aucune commande pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto border border-[#c4a35a]/20">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#12100e] text-[0.65rem] uppercase tracking-[0.12em] text-[#a89f8e]">
                <tr>
                  <th className="px-3 py-3">Commande</th>
                  <th className="px-3 py-3">Client</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Articles</th>
                  <th className="px-3 py-3">Total</th>
                  <th className="px-3 py-3">Paiement</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Heure</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-[#c4a35a]/15 hover:bg-white/[0.02]"
                  >
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-[#e0c878]"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      {o.customerFirstName} {o.customerLastName}
                    </td>
                    <td className="px-3 py-3 text-[#c4bbaa]">{o.type}</td>
                    <td className="px-3 py-3">{o.items.length}</td>
                    <td className="px-3 py-3 text-[#e0c878]">
                      {formatEuro(o.totalCents)}
                    </td>
                    <td className="px-3 py-3">{o.paymentStatus}</td>
                    <td className="px-3 py-3">{o.status}</td>
                    <td className="px-3 py-3 text-[#a89f8e]">
                      {o.createdAt.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
