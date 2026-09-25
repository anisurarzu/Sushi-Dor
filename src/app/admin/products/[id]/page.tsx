import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/pricing";
import { AdminAddonEditor } from "@/components/admin/AdminAddonEditor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

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

export default async function AdminProductPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      addonGroups: {
        orderBy: { displayOrder: "asc" },
        include: { addons: { orderBy: { displayOrder: "asc" } } },
      },
    },
  });
  if (!product) notFound();

  return (
    <main className="min-h-screen bg-ink px-4 py-10 text-bone md:px-8">
      <div className="mx-auto max-w-3xl">
        <a href="/admin" className="text-sm text-gold">
          ← Produits
        </a>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl">
          {product.nameFr}
        </h1>
        <p className="mt-2 text-mist">
          Prix de base {formatEuro(product.priceCents)}
        </p>
        <AdminAddonEditor
          productId={product.id}
          initialGroups={product.addonGroups.map((g) => ({
            id: g.id,
            nameFr: g.nameFr,
            selectionType: g.selectionType,
            required: g.required,
            minSelections: g.minSelections,
            maxSelections: g.maxSelections,
            isActive: g.isActive,
            addons: g.addons.map((a) => ({
              id: a.id,
              nameFr: a.nameFr,
              priceCents: a.priceCents,
              isActive: a.isActive,
            })),
          }))}
        />
      </div>
    </main>
  );
}
