"use client";

import Link from "next/link";
import { formatEuro } from "@/lib/pricing";
import {
  BulkDeleteToolbar,
  RowCheckbox,
  RowDeleteButtons,
  useBulkDelete,
} from "@/components/admin/BulkDeleteControls";

export type ProductListRow = {
  id: string;
  nameFr: string;
  imageUrl: string | null;
  categoryName: string;
  priceCents: number;
  isAvailable: boolean;
  isFeatured: boolean;
};

export function ProductsDeleteList({
  products,
}: {
  products: ProductListRow[];
}) {
  const bulk = useBulkDelete({
    resource: "products",
    ids: products.map((p) => p.id),
    label: "produit(s)",
  });

  if (products.length === 0) {
    return (
      <p className="border border-[#c4a35a]/20 p-8 text-center text-sm text-[#a89f8e]">
        Aucun produit disponible.{" "}
        <Link href="/admin/products/new" className="text-[#c4a35a]">
          Créer un produit
        </Link>
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
        idsCount={products.length}
      />
      <div className="overflow-x-auto border border-[#c4a35a]/20">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-[#12100e] text-[0.65rem] uppercase tracking-[0.12em] text-[#a89f8e]">
            <tr>
              <th className="px-3 py-3 w-10" />
              <th className="px-3 py-3">Image</th>
              <th className="px-3 py-3">Produit</th>
              <th className="px-3 py-3">Catégorie</th>
              <th className="px-3 py-3">Prix</th>
              <th className="px-3 py-3">Dispo</th>
              <th className="px-3 py-3">Featured</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className="border-t border-[#c4a35a]/15 hover:bg-white/[0.02]"
              >
                <td className="px-3 py-3">
                  <RowCheckbox
                    checked={bulk.selected.has(p.id)}
                    onChange={() => bulk.toggle(p.id)}
                    disabled={bulk.pending}
                  />
                </td>
                <td className="px-3 py-3">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.nameFr}
                      className="h-12 w-12 object-cover border border-[#c4a35a]/25 bg-[#0c0a08]"
                    />
                  ) : (
                    <div
                      className="flex h-12 w-12 items-center justify-center border border-[#c4a35a]/20 bg-[#0c0a08] text-[0.55rem] uppercase tracking-wide text-[#a89f8e]"
                      aria-hidden
                    >
                      —
                    </div>
                  )}
                </td>
                <td className="px-3 py-3">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="text-[#e0c878]"
                  >
                    {p.nameFr}
                  </Link>
                </td>
                <td className="px-3 py-3 text-[#c4bbaa]">{p.categoryName}</td>
                <td className="px-3 py-3">{formatEuro(p.priceCents)}</td>
                <td className="px-3 py-3">{p.isAvailable ? "Oui" : "Non"}</td>
                <td className="px-3 py-3">{p.isFeatured ? "Oui" : "—"}</td>
                <td className="px-3 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="border border-[#c4a35a]/40 px-2.5 py-1 text-xs text-[#e0c878]"
                    >
                      Éditer
                    </Link>
                    <RowDeleteButtons
                      id={p.id}
                      resource="products"
                      label={p.nameFr}
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
