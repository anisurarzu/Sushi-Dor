"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatEuro } from "@/lib/pricing";
import { AdminSelect } from "@/components/admin/AdminSelect";

type AddonSnap = {
  id: string;
  addonId: string | null;
  addonNameSnapshot: string;
  priceSnapshot: number;
};

type ItemSnap = {
  id: string;
  productId: string | null;
  productNameSnapshot: string;
  quantity: number;
  unitPriceSnapshot: number;
  lineTotalCents: number;
  basePriceSnapshot: number;
  addons: AddonSnap[];
};

type ProductOption = {
  id: string;
  nameFr: string;
  priceCents: number;
  addonGroups: {
    id: string;
    nameFr: string;
    selectionType: "SINGLE" | "MULTIPLE";
    required: boolean;
    minSelections: number;
    maxSelections: number;
    addons: { id: string; nameFr: string; priceCents: number; isActive: boolean }[];
  }[];
};

type OrderData = {
  id: string;
  orderNumber: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail: string;
  type: "DELIVERY" | "TAKEAWAY" | "DINE_IN";
  deliveryStreet: string | null;
  deliveryComplement: string | null;
  deliveryPostalCode: string | null;
  deliveryCity: string | null;
  notes: string | null;
  deliveryFeeCents: number;
  discountCents: number;
  discountCode: string | null;
  subtotalCents: number;
  totalCents: number;
  paymentStatus: string;
  restaurantId: string;
  items: ItemSnap[];
};

type EditableItem = {
  key: string;
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  addonIds: string[];
  addonLabels: string[];
  /** For display of preserved/historical unit until save */
  unitPriceCents: number;
  lineTotalCents: number;
};

type Props = {
  order: OrderData;
  products: ProductOption[];
  restaurants: { id: string; name: string }[];
};

function toEditable(items: ItemSnap[]): EditableItem[] {
  return items
    .filter((i) => i.productId)
    .map((i) => ({
      key: i.id,
      id: i.id,
      productId: i.productId!,
      productName: i.productNameSnapshot,
      quantity: i.quantity,
      addonIds: i.addons.map((a) => a.addonId).filter(Boolean) as string[],
      addonLabels: i.addons.map((a) => a.addonNameSnapshot),
      unitPriceCents: i.unitPriceSnapshot,
      lineTotalCents: i.lineTotalCents,
    }));
}

export function OrderEditor({ order, products, restaurants }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paymentWarning, setPaymentWarning] = useState<string | null>(null);

  const [customerFirstName, setCustomerFirstName] = useState(
    order.customerFirstName,
  );
  const [customerLastName, setCustomerLastName] = useState(
    order.customerLastName,
  );
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone);
  const [customerEmail, setCustomerEmail] = useState(order.customerEmail);
  const [type, setType] = useState(order.type);
  const [restaurantId, setRestaurantId] = useState(
    order.restaurantId || restaurants[0]?.id || "",
  );
  const [deliveryStreet, setDeliveryStreet] = useState(
    order.deliveryStreet || "",
  );
  const [deliveryComplement, setDeliveryComplement] = useState(
    order.deliveryComplement || "",
  );
  const [deliveryPostalCode, setDeliveryPostalCode] = useState(
    order.deliveryPostalCode || "",
  );
  const [deliveryCity, setDeliveryCity] = useState(order.deliveryCity || "");
  const [notes, setNotes] = useState(order.notes || "");
  const [deliveryFeeEuro, setDeliveryFeeEuro] = useState(
    (order.deliveryFeeCents / 100).toFixed(2),
  );
  const [discountEuro, setDiscountEuro] = useState(
    (order.discountCents / 100).toFixed(2),
  );
  const [items, setItems] = useState<EditableItem[]>(() =>
    toEditable(order.items),
  );

  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [editKey, setEditKey] = useState<string | null>(null);
  const [cfgQty, setCfgQty] = useState(1);
  const [cfgAddons, setCfgAddons] = useState<string[]>([]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 40);
    return products
      .filter((p) => p.nameFr.toLowerCase().includes(q))
      .slice(0, 40);
  }, [products, search]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const previewSubtotal = items.reduce((s, i) => s + i.lineTotalCents, 0);
  const previewDelivery =
    Math.round(Number(deliveryFeeEuro.replace(",", ".")) * 100) || 0;
  const previewDiscount =
    Math.round(Number(discountEuro.replace(",", ".")) * 100) || 0;
  const previewTotal = Math.max(
    0,
    previewSubtotal + previewDelivery - previewDiscount,
  );

  function openAdd() {
    setEditKey(null);
    setSelectedProductId(null);
    setCfgQty(1);
    setCfgAddons([]);
    setSearch("");
    setPickerOpen(true);
  }

  function openEdit(item: EditableItem) {
    setEditKey(item.key);
    setSelectedProductId(item.productId);
    setCfgQty(item.quantity);
    setCfgAddons(item.addonIds);
    setSearch("");
    setPickerOpen(true);
  }

  function toggleAddon(group: ProductOption["addonGroups"][0], addonId: string) {
    setCfgAddons((prev) => {
      if (group.selectionType === "SINGLE") {
        const groupIds = new Set(group.addons.map((a) => a.id));
        const cleared = prev.filter((id) => !groupIds.has(id));
        return [...cleared, addonId];
      }
      if (prev.includes(addonId)) return prev.filter((id) => id !== addonId);
      const groupSelected = prev.filter((id) =>
        group.addons.some((a) => a.id === id),
      );
      if (groupSelected.length >= group.maxSelections) return prev;
      return [...prev, addonId];
    });
  }

  function confirmProduct() {
    if (!selectedProduct) return;
    const addonLabels = selectedProduct.addonGroups
      .flatMap((g) => g.addons)
      .filter((a) => cfgAddons.includes(a.id))
      .map((a) => a.nameFr);
    const addonsUnit = selectedProduct.addonGroups
      .flatMap((g) => g.addons)
      .filter((a) => cfgAddons.includes(a.id))
      .reduce((s, a) => s + a.priceCents, 0);
    const unit = selectedProduct.priceCents + addonsUnit;
    const row: EditableItem = {
      key: editKey || `new-${selectedProduct.id}-${cfgAddons.slice().sort().join("-")}-${cfgQty}-${items.length}`,
      id: editKey
        ? items.find((i) => i.key === editKey)?.id
        : undefined,
      productId: selectedProduct.id,
      productName: selectedProduct.nameFr,
      quantity: cfgQty,
      addonIds: cfgAddons,
      addonLabels,
      unitPriceCents: unit,
      lineTotalCents: unit * cfgQty,
    };
    setItems((prev) => {
      if (editKey) return prev.map((i) => (i.key === editKey ? row : i));
      return [...prev, row];
    });
    setPickerOpen(false);
  }

  async function save() {
    setPending(true);
    setError(null);
    setSuccess(null);
    setPaymentWarning(null);
    const res = await fetch(`/api/admin/orders/${order.id}/edit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerFirstName,
        customerLastName,
        customerPhone,
        customerEmail,
        type,
        restaurantId: restaurantId || undefined,
        deliveryStreet: deliveryStreet || null,
        deliveryComplement: deliveryComplement || null,
        deliveryPostalCode: deliveryPostalCode || null,
        deliveryCity: deliveryCity || null,
        notes: notes || null,
        deliveryFeeCents: previewDelivery,
        discountCents: previewDiscount,
        items: items.map((i) => ({
          id: i.id,
          productId: i.productId,
          quantity: i.quantity,
          addonIds: i.addonIds,
        })),
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setSuccess("Commande mise à jour.");
    if (data.paymentWarning) setPaymentWarning(data.paymentWarning);
    if (data.order) {
      setItems(toEditable(data.order.items));
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="border border-[#c4a35a]/20 bg-[#12100e] p-4 sm:p-6">
        <h2 className="text-[0.65rem] uppercase tracking-[0.16em] text-[#c4a35a]">
          Client
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Prénom
            <input
              value={customerFirstName}
              onChange={(e) => setCustomerFirstName(e.target.value)}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Nom
            <input
              value={customerLastName}
              onChange={(e) => setCustomerLastName(e.target.value)}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Téléphone
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Email
            <input
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
        </div>
      </section>

      <section className="border border-[#c4a35a]/20 bg-[#12100e] p-4 sm:p-6">
        <h2 className="text-[0.65rem] uppercase tracking-[0.16em] text-[#c4a35a]">
          Type & livraison
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="block text-sm">
            <span className="mb-1 block">Type</span>
            <AdminSelect
              aria-label="Type de commande"
              value={type}
              onChange={(v) => setType(v as OrderData["type"])}
              options={[
                { value: "DELIVERY", label: "Livraison" },
                { value: "TAKEAWAY", label: "À emporter" },
                { value: "DINE_IN", label: "Sur place" },
              ]}
            />
          </div>
          <div className="block text-sm">
            <span className="mb-1 block">Restaurant</span>
            <AdminSelect
              aria-label="Restaurant"
              value={restaurantId}
              onChange={setRestaurantId}
              options={restaurants.map((r) => ({
                value: r.id,
                label: r.name,
              }))}
            />
          </div>
          <label className="block text-sm sm:col-span-2">
            Adresse
            <input
              value={deliveryStreet}
              onChange={(e) => setDeliveryStreet(e.target.value)}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Complément
            <input
              value={deliveryComplement}
              onChange={(e) => setDeliveryComplement(e.target.value)}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Code postal
            <input
              value={deliveryPostalCode}
              onChange={(e) => setDeliveryPostalCode(e.target.value)}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Ville
            <input
              value={deliveryCity}
              onChange={(e) => setDeliveryCity(e.target.value)}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            />
          </label>
        </div>
      </section>

      <section className="border border-[#c4a35a]/20 bg-[#12100e] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[0.65rem] uppercase tracking-[0.16em] text-[#c4a35a]">
            Articles
          </h2>
          <button
            type="button"
            onClick={openAdd}
            className="border border-[#c4a35a]/40 px-3 py-1.5 text-sm text-[#e0c878]"
          >
            + Ajouter un produit
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={item.key}
              className="border border-[#c4a35a]/15 bg-[#0a0908] p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[#f0e6c8]">{item.productName}</p>
                  {item.addonLabels.length > 0 ? (
                    <p className="mt-1 text-xs text-[#a89f8e]">
                      Options: {item.addonLabels.join(", ")}
                    </p>
                  ) : null}
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <button
                      type="button"
                      className="border border-[#c4a35a]/30 px-2"
                      onClick={() =>
                        setItems((prev) =>
                          prev.map((i) =>
                            i.key === item.key
                              ? {
                                  ...i,
                                  quantity: Math.max(1, i.quantity - 1),
                                  lineTotalCents:
                                    i.unitPriceCents *
                                    Math.max(1, i.quantity - 1),
                                }
                              : i,
                          ),
                        )
                      }
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      className="border border-[#c4a35a]/30 px-2"
                      onClick={() =>
                        setItems((prev) =>
                          prev.map((i) =>
                            i.key === item.key
                              ? {
                                  ...i,
                                  quantity: i.quantity + 1,
                                  lineTotalCents:
                                    i.unitPriceCents * (i.quantity + 1),
                                }
                              : i,
                          ),
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[#e0c878]">
                    {formatEuro(item.lineTotalCents)}
                  </p>
                  <div className="mt-2 flex gap-2 text-xs">
                    <button
                      type="button"
                      className="text-[#c4a35a]"
                      onClick={() => openEdit(item)}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="text-red-300"
                      onClick={() =>
                        setItems((prev) =>
                          prev.filter((i) => i.key !== item.key),
                        )
                      }
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-[#c4a35a]/20 pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Sous-total</dt>
            <dd>{formatEuro(previewSubtotal)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt>Livraison (€)</dt>
            <dd>
              <input
                value={deliveryFeeEuro}
                onChange={(e) => setDeliveryFeeEuro(e.target.value)}
                className="w-24 border border-[#c4a35a]/25 bg-transparent px-2 py-1 text-right"
              />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt>Remise (€)</dt>
            <dd>
              <input
                value={discountEuro}
                onChange={(e) => setDiscountEuro(e.target.value)}
                className="w-24 border border-[#c4a35a]/25 bg-transparent px-2 py-1 text-right"
              />
            </dd>
          </div>
          <div className="flex justify-between text-base text-[#e0c878]">
            <dt>TOTAL</dt>
            <dd>{formatEuro(previewTotal)}</dd>
          </div>
          <p className="text-xs text-[#a89f8e]">
            Paiement actuel: {order.paymentStatus} · Total enregistré{" "}
            {formatEuro(order.totalCents)}. Les totaux définitifs sont
            recalculés côté serveur.
          </p>
        </dl>
      </section>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
      {paymentWarning ? (
        <p className="border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          {paymentWarning} Un ajustement a été enregistré (Stripe non modifié
          automatiquement).
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending || items.length === 0}
          onClick={() => void save()}
          className="btn-gold"
        >
          {pending ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/admin/orders/${order.id}`)}
          className="border border-[#c4a35a]/30 px-4 py-2 text-sm text-[#c4bbaa]"
        >
          Annuler
        </button>
      </div>

      {pickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-[#c4a35a]/30 bg-[#12100e] p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-[family-name:var(--font-display)] text-xl text-[#e0c878]">
                {editKey ? "Modifier l'article" : "Ajouter un produit"}
              </h3>
              <button
                type="button"
                className="text-[#a89f8e]"
                onClick={() => setPickerOpen(false)}
              >
                Fermer
              </button>
            </div>

            {!selectedProduct ? (
              <>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher (California, Maki…)"
                  className="mt-4 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2 text-sm"
                />
                <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto text-sm">
                  {filteredProducts.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="flex w-full justify-between px-2 py-2 text-left hover:bg-white/5"
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setCfgQty(1);
                          setCfgAddons([]);
                        }}
                      >
                        <span>{p.nameFr}</span>
                        <span className="text-[#e0c878]">
                          {formatEuro(p.priceCents)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="mt-4 space-y-4">
                <p className="text-[#f0e6c8]">{selectedProduct.nameFr}</p>
                <label className="block text-sm">
                  Quantité
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={cfgQty}
                    onChange={(e) => setCfgQty(Number(e.target.value) || 1)}
                    className="mt-1 w-24 border border-[#c4a35a]/25 bg-transparent px-3 py-2"
                  />
                </label>
                {selectedProduct.addonGroups.map((g) => (
                  <div key={g.id}>
                    <p className="text-sm text-[#c4a35a]">
                      {g.nameFr}
                      {g.required ? " *" : ""}
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {g.addons
                        .filter((a) => a.isActive)
                        .map((a) => (
                          <li key={a.id}>
                            <label className="flex cursor-pointer items-center gap-2">
                              <input
                                type={
                                  g.selectionType === "SINGLE"
                                    ? "radio"
                                    : "checkbox"
                                }
                                name={g.id}
                                checked={cfgAddons.includes(a.id)}
                                onChange={() => toggleAddon(g, a.id)}
                              />
                              <span>
                                {a.nameFr}
                                {a.priceCents > 0
                                  ? ` (+${formatEuro(a.priceCents)})`
                                  : ""}
                              </span>
                            </label>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-gold"
                    onClick={confirmProduct}
                  >
                    {editKey ? "Mettre à jour" : "Ajouter à la commande"}
                  </button>
                  {!editKey ? (
                    <button
                      type="button"
                      className="text-sm text-[#a89f8e]"
                      onClick={() => setSelectedProductId(null)}
                    >
                      ← Retour
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
