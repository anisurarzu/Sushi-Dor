import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin("users.view");
  const users = await prisma.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "MANAGER", "STAFF", "ADMIN"] } },
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

      {users.length === 0 ? (
        <p className="text-sm text-[#a89f8e]">Aucun utilisateur staff.</p>
      ) : (
        <div className="overflow-x-auto border border-[#c4a35a]/20">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#12100e] text-[0.65rem] uppercase tracking-wider text-[#c4a35a]">
              <tr>
                <th className="px-3 py-2">Nom</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Rôle</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-[#c4a35a]/15">
                  <td className="px-3 py-2">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-3 py-2 text-[#c4bbaa]">{u.email}</td>
                  <td className="px-3 py-2 text-[#e0c878]">{u.role}</td>
                  <td className="px-3 py-2">
                    {u.isActive ? "Actif" : "Inactif"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="text-[#c4a35a] hover:text-[#e0c878]"
                    >
                      Éditer
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
