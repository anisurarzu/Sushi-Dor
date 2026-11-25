import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { UserCreateForm } from "@/components/admin/UserCreateForm";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ type?: string }>;
};

export default async function AdminNewUserPage({ searchParams }: Props) {
  await requireAdmin("users.create");
  const { type } = await searchParams;
  const isClient = type === "client";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={isClient ? "/admin/users?tab=clients" : "/admin/users"}
          className="text-sm text-[#c4a35a]"
        >
          ← Utilisateurs
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
          {isClient ? "Nouveau client" : "Nouvel utilisateur"}
        </h1>
      </div>
      <UserCreateForm isClient={isClient} />
    </div>
  );
}
