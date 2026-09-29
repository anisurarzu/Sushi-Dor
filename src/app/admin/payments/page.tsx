import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { order: { select: { id: true, orderNumber: true } } },
  });
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#c4a35a]">Finance</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl">Paiements</h1>
      </div>
      {payments.length === 0 ? (
        <p className="border border-[#c4a35a]/20 p-6 text-sm text-[#a89f8e]">Aucun paiement.</p>
      ) : (
        <div className="overflow-x-auto border border-[#c4a35a]/20">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-[#12100e] text-[0.65rem] uppercase tracking-[0.12em] text-[#a89f8e]">
              <tr>
                <th className="px-3 py-3">Commande</th>
                <th className="px-3 py-3">Montant</th>
                <th className="px-3 py-3">Statut</th>
                <th className="px-3 py-3">Provider</th>
                <th className="px-3 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-[#c4a35a]/15">
                  <td className="px-3 py-3">
                    <Link href={`/admin/orders/${p.order.id}`} className="text-[#e0c878]">
                      {p.order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{formatEuro(p.amountCents)} {p.currency}</td>
                  <td className="px-3 py-3">{p.status}</td>
                  <td className="px-3 py-3">{p.provider}</td>
                  <td className="px-3 py-3 text-[#a89f8e]">{p.createdAt.toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
