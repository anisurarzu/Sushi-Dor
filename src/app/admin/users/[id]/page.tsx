import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { effectiveRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { UserEditForm } from "@/components/admin/UserEditForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminUserEditPage({ params }: Props) {
  const admin = await requireAdmin("users.edit");
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { userPermissions: true },
  });
  if (!user || user.role === "CUSTOMER") notFound();

  const canEditSuper =
    effectiveRole(admin.role) === "SUPER_ADMIN" || admin.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="text-sm text-[#c4a35a]">
          ← Utilisateurs
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
          {user.firstName} {user.lastName}
        </h1>
        <p className="mt-1 text-sm text-[#a89f8e]">
          {user.email} · {user.role}
        </p>
      </div>
      <UserEditForm
        user={{
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          userPermissions: user.userPermissions,
        }}
        canEditSuper={canEditSuper}
      />
    </div>
  );
}
