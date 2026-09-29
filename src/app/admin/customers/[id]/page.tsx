import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";
import { CustomerEditForm } from "@/components/admin/CustomerEditForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminCustomerDetailPage({ params }: Props) {
  await requireAdmin("customers.view");
  const { id } = await params;
  const email = decodeURIComponent(id);
  const [orders, account] = await Promise.all([
    prisma.order.findMany({
      where: { customerEmail: email },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
    prisma.user.findUnique({ where: { email } }),
  ]);
  if (orders.length === 0 && !account) notFound();
  const latest = orders[0];
  const spent = orders.reduce((s, o) => s + o.totalCents, 0);

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="text-sm text-[#c4a35a]">
        ← Clients
      </Link>
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          {account
            ? `${account.firstName || ""} ${account.lastName || ""}`
            : `${latest.customerFirstName} ${latest.customerLastName}`}
        </h1>
        <p className="mt-1 text-sm text-[#c4bbaa]">
          {account?.email || latest.customerEmail} ·{" "}
          {account?.phone || latest?.customerPhone}
        </p>
        <p className="mt-2 text-[#e0c878]">
          {orders.length} commande(s) · {formatEuro(spent)}
        </p>
      </div>
      <CustomerEditForm
        userId={account?.id}
        email={account?.email || latest.customerEmail}
        firstName={account?.firstName || latest.customerFirstName}
        lastName={account?.lastName || latest.customerLastName}
        phone={account?.phone || latest?.customerPhone || ""}
      />
      <div className="space-y-2">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/admin/orders/${o.id}`}
            className="block border border-[#c4a35a]/20 bg-[#12100e] p-3 text-sm"
          >
            <div className="flex justify-between gap-2">
              <span className="text-[#e0c878]">{o.orderNumber}</span>
              <span>{formatEuro(o.totalCents)}</span>
            </div>
            <p className="text-xs text-[#a89f8e]">
              {o.createdAt.toLocaleString("fr-FR")} · {o.status} ·{" "}
              {o.paymentStatus}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
