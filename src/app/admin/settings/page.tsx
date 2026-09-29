import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin("ADMIN");
  const restaurant = await prisma.restaurant.findFirst();
  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Réglages</h1>
      <section className="border border-[#c4a35a]/20 bg-[#12100e] p-4 text-sm">
        <h2 className="text-[#c4a35a]">Restaurant</h2>
        {restaurant ? (
          <dl className="mt-3 space-y-1 text-[#c4bbaa]">
            <div>Nom: {restaurant.name}</div>
            <div>Ville: {restaurant.city}</div>
            <div>Devise: EUR</div>
            <div>Frais livraison défaut: {(restaurant.deliveryFeeCents / 100).toFixed(2)} €</div>
            <div>Temps prépa: {restaurant.prepTimeMinutes} min</div>
          </dl>
        ) : (
          <p className="mt-2 text-[#a89f8e]">Aucun restaurant.</p>
        )}
        <p className="mt-4 text-xs text-[#a89f8e]">
          Les clés Stripe / secrets API ne sont jamais exposés dans cette interface.
        </p>
      </section>
    </div>
  );
}
