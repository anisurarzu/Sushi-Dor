import Link from "next/link";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ order?: string }> };

export default async function CheckoutCancelPage({ searchParams }: Props) {
  const { order: orderId } = await searchParams;

  if (orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (order && order.paymentStatus !== "PAID") {
      // Keep as pending/unpaid — do not mark paid
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "UNPAID", status: "PENDING_PAYMENT" },
      });
      await prisma.payment.updateMany({
        where: { orderId },
        data: { status: "UNPAID" },
      });
    }
  }

  return (
    <main className="bg-ink text-bone">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-4 pb-20 pt-28 text-center sm:px-6 sm:pt-32">
        <p className="text-[0.7rem] uppercase tracking-[0.2em] text-gold">
          Paiement
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl sm:text-5xl">
          Votre paiement a été annulé.
        </h1>
        <p className="mt-4 text-[#c4bbaa]">
          Aucun montant n&apos;a été débité. Votre panier est conservé.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/cart" className="btn-gold">
            Retour au panier
          </Link>
          <Link href="/menu" className="btn-ghost">
            Retour au menu
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
