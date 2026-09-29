import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();

  if (!user) {
    return <>{children}</>;
  }

  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "Admin";

  return (
    <AdminShell adminName={name} adminEmail={user.email}>
      {children}
    </AdminShell>
  );
}
