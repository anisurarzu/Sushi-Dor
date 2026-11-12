import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { getCustomerUser } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { CustomerLogoutButton } from "@/components/auth/CustomerLogoutButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mon compte · Sushi D'or",
};

export default async function AccountPage() {
  const user = await getCustomerUser();
  if (!user) redirect("/compte/connexion?next=/compte");

  const reservations = await prisma.reservation.findMany({
    where: { userId: user.id, deletedStatus: 0 },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    take: 10,
    include: { restaurant: { select: { name: true, city: true } } },
  });

  const orders = await prisma.order.findMany({
    where: { userId: user.id, deletedStatus: 0 },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalCents: true,
      createdAt: true,
      type: true,
    },
  });

  return (
    <main className="bg-ink text-bone">
      <div className="relative">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 md:px-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-[0.6rem] uppercase tracking-[0.22em] text-gold">
                Compte client
              </p>
              <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
                Bonjour
                {user.firstName ? (
                  <>
                    , <span className="gold-text">{user.firstName}</span>
                  </>
                ) : null}
              </h1>
              <p className="mt-2 text-sm text-mist">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/reservation" className="btn-gold">
                Réserver
              </Link>
              <Link href="/menu" className="header-cta header-cta--ghost">
                Commander
              </Link>
              <CustomerLogoutButton />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 text-[0.65rem] uppercase tracking-[0.18em] text-gold">
                Réservations récentes
              </h2>
              {reservations.length === 0 ? (
                <p className="text-sm text-mist">Aucune réservation pour l&apos;instant.</p>
              ) : (
                <ul className="space-y-2">
                  {reservations.map((r) => (
                    <li
                      key={r.id}
                      className="border border-[color:var(--line)] bg-ink-soft/40 px-4 py-3 text-sm"
                    >
                      <div className="flex justify-between gap-3">
                        <span className="text-bone">
                          {r.date.toISOString().slice(0, 10)} · {r.startTime}
                        </span>
                        <span className="text-mist">{r.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-mist">
                        {r.restaurant.name} · {r.partySize} convives ·{" "}
                        {r.confirmationCode}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-[0.65rem] uppercase tracking-[0.18em] text-gold">
                Commandes récentes
              </h2>
              {orders.length === 0 ? (
                <p className="text-sm text-mist">Aucune commande pour l&apos;instant.</p>
              ) : (
                <ul className="space-y-2">
                  {orders.map((o) => (
                    <li
                      key={o.id}
                      className="border border-[color:var(--line)] bg-ink-soft/40 px-4 py-3 text-sm"
                    >
                      <div className="flex justify-between gap-3">
                        <span className="text-bone">{o.orderNumber}</span>
                        <span className="text-mist">
                          {(o.totalCents / 100).toFixed(2)} €
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-mist">
                        {o.type} · {o.status} ·{" "}
                        {o.createdAt.toISOString().slice(0, 10)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
