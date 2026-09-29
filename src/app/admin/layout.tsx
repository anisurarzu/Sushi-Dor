import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page uses the same /admin segment — skip shell there via parallel check
  // We detect login by checking if children is login-only: use path via headers
  const user = await getAdminUser();

  // When not logged in, only /admin/login should be reachable without shell.
  // Child pages call requireAdmin themselves; layout just wraps when authenticated.
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
