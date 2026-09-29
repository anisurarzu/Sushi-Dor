import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requireAdmin();
  const orders = await prisma.order.groupBy({
    by: ["customerEmail"],
    _count: { _all: true },
    _sum: { totalCents: true },
    _max: { createdAt: true },
  });
  const profiles = await Promise.all(
    orders.map(async (o) => {
      const last = await prisma.order.findFirst({
        where: { customerEmail: o.customerEmail },
        orderBy: { createdAt: "desc" },
      });
      return {
        email: o.customerEmail,
        name: last ? `${last.customerFirstName} ${last.customerLastName}` : o.customerEmail,
        phone: last?.customerPhone || "",
        orders: o._count._all,
        spent: o._sum.totalCents || 0,
        lastOrder: o._max.createdAt,
      };
    }),
  );
  profiles.sort((a, b) => b.spent - a.spent);
  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Clients</h1>
      {profiles.length === 0 ? (
        <p className="border border-[#c4a35a]/20 p-6 text-sm text-[#a89f8e]">Aucun client pour le moment.</p>
      ) : (
        <div className="overflow-x-auto border border-[#c4a35a]/20">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-[#12100e] text-[0.65rem] uppercase tracking-[0.12em] text-[#a89f8e]">
              <tr>
                <th className="px-3 py-3">Client</th>
                <th className="px-3 py-3">Commandes</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Dernière</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.email} className="border-t border-[#c4a35a]/15">
                  <td className="px-3 py-3">
                    <Link href={`/admin/customers/${encodeURIComponent(p.email)}`} className="text-[#e0c878]">
                      {p.name}
                    </Link>
                    <span className="block text-xs text-[#a89f8e]">{p.email}</span>
                  </td>
                  <td className="px-3 py-3">{p.orders}</td>
                  <td className="px-3 py-3">{formatEuro(p.spent)}</td>
                  <td className="px-3 py-3 text-[#a89f8e]">
                    {p.lastOrder ? p.lastOrder.toLocaleDateString("fr-FR") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
