import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const jar = await cookies();
  const token = jar.get("sd_admin")?.value;
  if (!token) redirect("/admin/login");
  const session = await prisma.session.findUnique({
    where: { tokenHash: token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }
}

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: { include: { addons: true } } },
  });

  return (
    <main className="min-h-screen bg-ink px-4 py-10 text-bone md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-3xl">
            Commandes
          </h1>
          <Link href="/admin" className="text-sm text-gold">
            Produits
          </Link>
        </div>
        <div className="mt-8 space-y-4">
          {orders.map((o) => (
            <article
              key={o.id}
              className="border border-[color:var(--line)] p-4 text-sm"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <h2 className="text-champagne">{o.orderNumber}</h2>
                <span className="text-gold">{formatEuro(o.totalCents)}</span>
              </div>
              <p className="mt-1 text-mist">
                {o.status} · {o.paymentStatus} · {o.type} · {o.customerFirstName}{" "}
                {o.customerLastName}
              </p>
              <ul className="mt-3 space-y-1 text-mist">
                {o.items.map((item) => (
                  <li key={item.id}>
                    {item.productNameSnapshot} × {item.quantity}
                    {item.addons.length > 0
                      ? ` — ${item.addons
                          .map((a) => `${a.addonNameSnapshot}×${a.quantity}`)
                          .join(", ")}`
                      : ""}
                  </li>
                ))}
              </ul>
            </article>
          ))}
          {orders.length === 0 ? (
            <p className="text-mist">Aucune commande pour le moment.</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
