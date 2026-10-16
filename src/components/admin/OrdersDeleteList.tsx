"use client";

import Link from "next/link";
import { formatEuro } from "@/lib/pricing";
import {
  BulkDeleteToolbar,
  RowCheckbox,
  RowDeleteButtons,
  useBulkDelete,
} from "@/components/admin/BulkDeleteControls";

export type OrderListRow = {
  id: string;
  orderNumber: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  type: string;
  itemCount: number;
  totalCents: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
};

export function OrdersDeleteList({ orders }: { orders: OrderListRow[] }) {
  const bulk = useBulkDelete({
    resource: "orders",
    ids: orders.map((o) => o.id),
    label: "commande(s)",
  });

  if (orders.length === 0) {
    return (
      <p className="border border-[#c4a35a]/20 p-8 text-center text-sm text-[#a89f8e]">
        Aucune commande pour ces filtres.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <BulkDeleteToolbar
        allSelected={bulk.allSelected}
        toggleAll={bulk.toggleAll}
        selectedCount={bulk.selectedCount}
        pending={bulk.pending}
        msg={bulk.msg}
        onSoft={() => bulk.run("soft")}
        onHard={() => bulk.run("hard")}
        idsCount={orders.length}
      />

      <div className="space-y-3 lg:hidden">
        {orders.map((o) => (
          <div
            key={o.id}
            className="flex gap-3 border border-[#c4a35a]/20 bg-[#12100e] p-4"
          >
            <RowCheckbox
              checked={bulk.selected.has(o.id)}
              onChange={() => bulk.toggle(o.id)}
              disabled={bulk.pending}
            />
            <Link href={`/admin/orders/${o.id}`} className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <span className="text-[#e0c878]">#{o.orderNumber}</span>
                <span>{formatEuro(o.totalCents)}</span>
              </div>
              <p className="mt-1 text-sm text-[#c4bbaa]">
                {o.customerFirstName} {o.customerLastName} · {o.type}
              </p>
              <p className="mt-1 text-xs text-[#a89f8e]">
                {o.paymentStatus} · {o.status}
              </p>
            </Link>
            <div className="flex shrink-0 flex-col items-end gap-2 self-center">
              <Link
                href={`/admin/orders/${o.id}/edit`}
                className="border border-[#c4a35a]/40 px-3 py-2 text-xs text-[#e0c878]"
              >
                Éditer
              </Link>
              <RowDeleteButtons
                id={o.id}
                resource="orders"
                label={`#${o.orderNumber}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto border border-[#c4a35a]/20 lg:block">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-[#12100e] text-[0.65rem] uppercase tracking-[0.12em] text-[#a89f8e]">
            <tr>
              <th className="px-3 py-3 w-10" />
              <th className="px-3 py-3">#</th>
              <th className="px-3 py-3">Client</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Items</th>
              <th className="px-3 py-3">Total</th>
              <th className="px-3 py-3">Paiement</th>
              <th className="px-3 py-3">Statut</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className="border-t border-[#c4a35a]/15 hover:bg-white/[0.02]"
              >
                <td className="px-3 py-3">
                  <RowCheckbox
                    checked={bulk.selected.has(o.id)}
                    onChange={() => bulk.toggle(o.id)}
                    disabled={bulk.pending}
                  />
                </td>
                <td className="px-3 py-3">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="text-[#e0c878]"
                  >
                    #{o.orderNumber}
                  </Link>
                </td>
                <td className="px-3 py-3">
                  {o.customerFirstName} {o.customerLastName}
                  <span className="block text-xs text-[#a89f8e]">
                    {o.customerPhone}
                  </span>
                </td>
                <td className="px-3 py-3">{o.type}</td>
                <td className="px-3 py-3">{o.itemCount}</td>
                <td className="px-3 py-3">{formatEuro(o.totalCents)}</td>
                <td className="px-3 py-3">{o.paymentStatus}</td>
                <td className="px-3 py-3">{o.status}</td>
                <td className="px-3 py-3 text-[#a89f8e]">
                  {new Date(o.createdAt).toLocaleString("fr-FR")}
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-xs text-[#c4bbaa] hover:text-[#e0c878]"
                    >
                      Voir
                    </Link>
                    <Link
                      href={`/admin/orders/${o.id}/edit`}
                      className="border border-[#c4a35a]/40 px-2.5 py-1 text-xs text-[#e0c878] hover:bg-[#c4a35a]/10"
                    >
                      Éditer
                    </Link>
                    <RowDeleteButtons
                      id={o.id}
                      resource="orders"
                      label={`#${o.orderNumber}`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
