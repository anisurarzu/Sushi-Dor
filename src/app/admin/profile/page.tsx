import { requireAdmin } from "@/lib/admin-auth";
import { ProfileForm } from "@/components/admin/ProfileForm";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const admin = await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Mon profil
        </h1>
        <p className="mt-1 text-sm text-[#a89f8e]">
          Vous ne pouvez pas vous attribuer de permissions supplémentaires.
        </p>
      </div>
      <ProfileForm
        user={{
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          phone: null,
          role: admin.role,
        }}
      />
    </div>
  );
}
