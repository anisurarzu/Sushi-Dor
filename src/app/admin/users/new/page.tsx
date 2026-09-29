import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { UserCreateForm } from "@/components/admin/UserCreateForm";

export const dynamic = "force-dynamic";

export default async function AdminNewUserPage() {
  await requireAdmin("users.create");
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="text-sm text-[#c4a35a]">
          ← Utilisateurs
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
          Nouvel utilisateur
        </h1>
      </div>
      <UserCreateForm />
    </div>
  );
}
