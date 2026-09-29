import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";
import type { OrderStatus, OrderType, PaymentStatus } from "@prisma/client";
import { OrderPoller } from "@/components/admin/OrderPoller";
import { OrdersFilters } from "@/components/admin/OrdersFilters";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    payment?: string;
    type?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 20;

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));
  const q = sp.q?.trim() || "";

  const where = {
    AND: [
      q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: "insensitive" as const } },
              { customerEmail: { contains: q, mode: "insensitive" as const } },
              { customerLastName: { contains: q, mode: "insensitive" as const } },
              { customerFirstName: { contains: q, mode: "insensitive" as const } },
              { customerPhone: { contains: q } },
            ],
          }
        : {},
      sp.status ? { status: sp.status as OrderStatus } : {},
      sp.payment ? { paymentStatus: sp.payment as PaymentStatus } : {},
      sp.type ? { type: sp.type as OrderType } : {},
    ],
  };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { items: true },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const latestPaidId = orders.find((o) => o.paymentStatus === "PAID")?.id;

  return (
    <div className="space-y-6">
      <OrderPoller knownLatestId={latestPaidId} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#c4a35a]">
            Opérations
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl">
            Commandes
          </h1>
        </div>
        <p className="text-sm text-[#a89f8e]">{total} résultat(s)</p>
      </div>

      <OrdersFilters
        q={q}
        status={sp.status || ""}
        payment={sp.payment || ""}
        type={sp.type || ""}
      />

      {orders.length === 0 ? (
        <p className="border border-[#c4a35a]/20 p-8 text-center text-sm text-[#a89f8e]">
          Aucune commande pour ces filtres.
        </p>
      ) : (
        <div className="space-y-3 lg:hidden">
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex gap-3 border border-[#c4a35a]/20 bg-[#12100e] p-4"
            >
              <Link href={`/admin/orders/${o.id}`} className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="text-[#e0c878]">{o.orderNumber}</span>
                  <span>{formatEuro(o.totalCents)}</span>
                </div>
                <p className="mt-1 text-sm text-[#c4bbaa]">
                  {o.customerFirstName} {o.customerLastName} · {o.type}
                </p>
                <p className="mt-1 text-xs text-[#a89f8e]">
                  {o.paymentStatus} · {o.status}
                </p>
              </Link>
              <Link
                href={`/admin/orders/${o.id}/edit`}
                className="shrink-0 self-center border border-[#c4a35a]/40 px-3 py-2 text-xs text-[#e0c878]"
              >
                Éditer
              </Link>
            </div>
          ))}
        </div>
      )}

      {orders.length > 0 ? (
        <div className="hidden overflow-x-auto border border-[#c4a35a]/20 lg:block">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-[#12100e] text-[0.65rem] uppercase tracking-[0.12em] text-[#a89f8e]">
              <tr>
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Client</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Items</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Paiement</th>
                <th className="px-3 py-3">Statut</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
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
                    <span className="block text-xs text-[#a89f8e]">
                      {o.customerPhone}
                    </span>
                  </td>
                  <td className="px-3 py-3">{o.type}</td>
                  <td className="px-3 py-3">{o.items.length}</td>
                  <td className="px-3 py-3">{formatEuro(o.totalCents)}</td>
                  <td className="px-3 py-3">{o.paymentStatus}</td>
                  <td className="px-3 py-3">{o.status}</td>
                  <td className="px-3 py-3 text-[#a89f8e]">
                    {o.createdAt.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-xs text-[#c4bbaa] hover:text-[#e0c878]"
                      >
                        Voir
                      </Link>
                      <Link
                        href={`/admin/orders/${o.id}/edit`}
                        className="border border-[#c4a35a]/40 px-2.5 py-1 text-xs text-[#e0c878] hover:bg-[#c4a35a]/10"
                      >
                        Éditer
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {pages > 1 ? (
        <div className="flex gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/orders?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(sp.status ? { status: sp.status } : {}),
                ...(sp.payment ? { payment: sp.payment } : {}),
                ...(sp.type ? { type: sp.type } : {}),
                page: String(p),
              }).toString()}`}
              className={`border px-3 py-1 text-xs ${
                p === page
                  ? "border-[#c4a35a] text-[#e0c878]"
                  : "border-[#c4a35a]/25 text-[#a89f8e]"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
