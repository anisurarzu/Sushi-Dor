import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/soft-delete";
import { UsersDeleteList } from "@/components/admin/UsersDeleteList";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin("users.view");
  const users = await prisma.user.findMany({
    where: {
      ...notDeleted,
      role: { in: ["SUPER_ADMIN", "MANAGER", "STAFF", "ADMIN"] },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">
            Utilisateurs
          </h1>
          <p className="mt-1 text-sm text-[#a89f8e]">
            Comptes administrateurs, managers et staff.
          </p>
        </div>
        <Link href="/admin/users/new" className="btn-gold text-sm">
          Nouvel utilisateur
        </Link>
      </div>

      <UsersDeleteList
        users={users.map((u) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
        }))}
      />
    </div>
  );
}
