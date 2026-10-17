"use client";

import Link from "next/link";
import {
  BulkDeleteToolbar,
  DeleteListShell,
  RowCheckbox,
  RowDeleteButtons,
  useBulkDelete,
} from "@/components/admin/BulkDeleteControls";

export type UserListRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  isActive: boolean;
};

export function UsersDeleteList({ users }: { users: UserListRow[] }) {
  const bulk = useBulkDelete({
    resource: "users",
    ids: users.map((u) => u.id),
    label: "utilisateur(s)",
  });

  if (users.length === 0) {
    return <p className="text-sm text-[#a89f8e]">Aucun utilisateur staff.</p>;
  }

  return (
    <div className="space-y-3">
      <BulkDeleteToolbar
        allSelected={bulk.allSelected}
        toggleAll={bulk.toggleAll}
        selectedCount={bulk.selectedCount}
        pending={bulk.pending}
        msg={bulk.msg}
        onSoft={() => void bulk.run("soft")}
        onHard={() => void bulk.run("hard")}
        idsCount={users.length}
      />
      <DeleteListShell pending={bulk.pending} skeletonCols={5}>
      <div className="overflow-x-auto border border-[#c4a35a]/20">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[#12100e] text-[0.65rem] uppercase tracking-wider text-[#c4a35a]">
            <tr>
              <th className="px-3 py-2 w-10" />
              <th className="px-3 py-2">Nom</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Rôle</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-[#c4a35a]/15">
                <td className="px-3 py-2">
                  <RowCheckbox
                    checked={bulk.selected.has(u.id)}
                    onChange={() => bulk.toggle(u.id)}
                    disabled={bulk.pending}
                  />
                </td>
                <td className="px-3 py-2">
                  {u.firstName} {u.lastName}
                </td>
                <td className="px-3 py-2 text-[#c4bbaa]">{u.email}</td>
                <td className="px-3 py-2 text-[#e0c878]">{u.role}</td>
                <td className="px-3 py-2">
                  {u.isActive ? "Actif" : "Inactif"}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="text-[#c4a35a] hover:text-[#e0c878]"
                    >
                      Éditer
                    </Link>
                    <RowDeleteButtons
                      id={u.id}
                      resource="users"
                      label={u.email}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </DeleteListShell>
    </div>
  );
}
