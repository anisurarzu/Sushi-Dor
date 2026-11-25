import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/soft-delete";
import { UsersDeleteList } from "@/components/admin/UsersDeleteList";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminUsersPage({ searchParams }: Props) {
  await requireAdmin("users.view");
  const { tab } = await searchParams;
  const activeTab = tab === "clients" ? "clients" : "staff";

  const [staff, clients] = await Promise.all([
    prisma.user.findMany({
      where: {
        ...notDeleted,
        role: { in: ["SUPER_ADMIN", "MANAGER", "STAFF", "ADMIN"] },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: {
        ...notDeleted,
        role: "CUSTOMER",
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const list = activeTab === "clients" ? clients : staff;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">
            Utilisateurs
          </h1>
          <p className="mt-1 text-sm text-[#a89f8e]">
            Comptes staff et clients (même édition / activation / suppression).
          </p>
        </div>
        <Link
          href={
            activeTab === "clients"
              ? "/admin/users/new?type=client"
              : "/admin/users/new"
          }
          className="btn-gold text-sm"
        >
          {activeTab === "clients" ? "Nouveau client" : "Nouvel utilisateur"}
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[#c4a35a]/20 pb-3">
        <Link
          href="/admin/users"
          className={`px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.14em] ${
            activeTab === "staff"
              ? "border border-[#c4a35a]/50 bg-[#c4a35a]/15 text-[#e0c878]"
              : "border border-transparent text-[#a89f8e] hover:text-[#f0e6c8]"
          }`}
        >
          Staff ({staff.length})
        </Link>
        <Link
          href="/admin/users?tab=clients"
          className={`px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.14em] ${
            activeTab === "clients"
              ? "border border-[#c4a35a]/50 bg-[#c4a35a]/15 text-[#e0c878]"
              : "border border-transparent text-[#a89f8e] hover:text-[#f0e6c8]"
          }`}
        >
          Clients ({clients.length})
        </Link>
      </div>

      <UsersDeleteList
        emptyLabel={
          activeTab === "clients"
            ? "Aucun compte client."
            : "Aucun utilisateur staff."
        }
        users={list.map((u) => ({
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
