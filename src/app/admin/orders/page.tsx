import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/soft-delete";
import type { OrderStatus, OrderType, PaymentStatus } from "@prisma/client";
import { OrderPoller } from "@/components/admin/OrderPoller";
import { OrdersFilters } from "@/components/admin/OrdersFilters";
import { OrdersDeleteList } from "@/components/admin/OrdersDeleteList";

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
      notDeleted,
      q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: "insensitive" as const } },
              { customerEmail: { contains: q, mode: "insensitive" as const } },
              { customerLastName: { contains: q, mode: "insensitive" as const } },
              {
                customerFirstName: { contains: q, mode: "insensitive" as const },
              },
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

      <OrdersDeleteList
        orders={orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerFirstName: o.customerFirstName,
          customerLastName: o.customerLastName,
          customerPhone: o.customerPhone,
          type: o.type,
          itemCount: o.items.length,
          totalCents: o.totalCents,
          paymentStatus: o.paymentStatus,
          status: o.status,
          createdAt: o.createdAt.toISOString(),
        }))}
      />

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
