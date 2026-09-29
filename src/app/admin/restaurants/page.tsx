import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { RestaurantManager } from "@/components/admin/RestaurantManager";

export const dynamic = "force-dynamic";

export default async function AdminRestaurantsPage() {
  await requireAdmin("restaurants.view");
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { name: "asc" },
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Restaurants
        </h1>
        <p className="mt-1 text-sm text-[#a89f8e]">
          Archivage préféré à la suppression si historique présent.
        </p>
      </div>
      <RestaurantManager initial={restaurants} />
    </div>
  );
}
