import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  await requireAdmin("audit_logs.view");
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { email: true, firstName: true, lastName: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Journal d&apos;audit
        </h1>
        <p className="mt-1 text-sm text-[#a89f8e]">
          100 dernières actions administrateur.
        </p>
      </div>
      {logs.length === 0 ? (
        <p className="text-sm text-[#a89f8e]">Aucune entrée.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {logs.map((log) => (
            <li
              key={log.id}
              className="border border-[#c4a35a]/15 bg-[#12100e] px-3 py-2"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <span className="text-[#e0c878]">{log.action}</span>
                <span className="text-xs text-[#a89f8e]">
                  {log.createdAt.toLocaleString("fr-FR")}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#c4bbaa]">
                {log.user
                  ? `${log.user.firstName || ""} ${log.user.lastName || ""} <${log.user.email}>`
                  : "Système"}
                {log.entity ? ` · ${log.entity}` : ""}
                {log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
