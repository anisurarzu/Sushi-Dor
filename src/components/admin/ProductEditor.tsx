"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AdminSelect } from "@/components/admin/AdminSelect";
import { ProductImageManager } from "@/components/admin/ProductImageManager";

type Category = { id: string; nameFr: string };

type ExistingImage = {
  id: string;
  url: string;
  alt: string | null;
  displayOrder: number;
};

type Props = {
  categories: Category[];
  initial?: {
    id?: string;
    nameFr: string;
    slug: string;
    categoryId: string;
    shortDescription: string | null;
    description: string | null;
    priceCents: number;
    isFeatured: boolean;
    isAvailable: boolean;
    sortOrder: number;
  };
  initialImages?: ExistingImage[];
};

type PendingFile = {
  key: string;
  file: File;
  previewUrl: string;
};

const ALLOWED = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 3;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ProductEditor({ categories, initial, initialImages = [] }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [nameFr, setNameFr] = useState(initial?.nameFr || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId || categories[0]?.id || "",
  );
  const [shortDescription, setShortDescription] = useState(
    initial?.shortDescription || "",
  );
  const [description, setDescription] = useState(initial?.description || "");
  const [priceEuro, setPriceEuro] = useState(
    initial ? (initial.priceCents / 100).toFixed(2) : "0.00",
  );
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured || false);
  const [isAvailable, setIsAvailable] = useState(
    initial?.isAvailable ?? true,
  );
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const isEdit = Boolean(initial?.id);

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    const incoming = Array.from(list);
    setError(null);
    setPendingFiles((prev) => {
      const next = [...prev];
      for (const file of incoming) {
        if (next.length >= MAX_IMAGES) {
          setError("Maximum 3 images par produit.");
          break;
        }
        if (!ALLOWED.has(file.type)) {
          setError("Formats acceptés : JPG, PNG, WEBP, AVIF.");
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError("Image trop lourde (max 5 Mo).");
          continue;
        }
        next.push({
          key: `${file.name}-${file.size}-${file.lastModified}-${next.length}`,
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
      return next;
    });
  }

  function removePending(key: string) {
    setPendingFiles((prev) => {
      const target = prev.find((f) => f.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.key !== key);
    });
  }

  async function uploadPending(productId: string) {
    for (const item of pendingFiles) {
      const fd = new FormData();
      fd.append("file", item.file);
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload image échoué");
      }
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    const priceCents = Math.round(Number(priceEuro.replace(",", ".")) * 100);
    if (!nameFr.trim() || !categoryId || Number.isNaN(priceCents) || priceCents < 0) {
      setError("Nom, catégorie et prix valides requis.");
      setPending(false);
      return;
    }
    const payload = {
      nameFr: nameFr.trim(),
      slug: (slug || slugify(nameFr)).trim(),
      categoryId,
      shortDescription: shortDescription.trim() || null,
      description: description.trim() || null,
      priceCents,
      isFeatured,
      isAvailable,
      sortOrder: Number(sortOrder) || 0,
    };
    try {
      const res = await fetch(
        initial?.id ? `/api/admin/products/${initial.id}` : "/api/admin/products",
        {
          method: initial?.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        setPending(false);
        return;
      }
      if (!isEdit && pendingFiles.length > 0) {
        setSuccess("Produit créé — envoi des images…");
        await uploadPending(data.product.id);
      }
      setSuccess(isEdit ? "Produit mis à jour." : "Produit créé.");
      setPending(false);
      router.push(`/admin/products/${data.product.id}`);
      router.refresh();
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <div className="space-y-6">
      {isEdit && initial?.id ? (
        <ProductImageManager
          productId={initial.id}
          initialImages={initialImages}
        />
      ) : (
        <section className="border border-[#c4a35a]/20 bg-[#12100e] p-4 sm:p-6">
          <h2 className="text-[0.65rem] uppercase tracking-[0.16em] text-[#c4a35a]">
            Images
          </h2>
          <p className="mt-1 text-xs text-[#a89f8e]">
            Upload depuis l&apos;ordinateur — maximum 3 images (JPG, PNG, WEBP,
            AVIF · 5 Mo). La première devient l&apos;image principale.
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`mt-4 border border-dashed px-4 py-8 text-center transition-colors ${
              dragOver
                ? "border-[#c4a35a] bg-[#c4a35a]/10"
                : "border-[#c4a35a]/30 bg-[#0a0908]"
            }`}
          >
            <p className="text-sm text-[#c4bbaa]">
              Glissez-déposez vos images ici
            </p>
            <button
              type="button"
              disabled={pendingFiles.length >= MAX_IMAGES}
              onClick={() => fileRef.current?.click()}
              className="mt-3 border border-[#c4a35a]/40 px-3 py-2 text-sm text-[#e0c878] disabled:opacity-40"
            >
              + Ajouter une image
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {pendingFiles.length >= MAX_IMAGES ? (
              <p className="mt-2 text-xs text-[#a89f8e]">
                Maximum 3 images par produit.
              </p>
            ) : null}
          </div>

          {pendingFiles.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {pendingFiles.map((item, index) => (
                <div
                  key={item.key}
                  className="border border-[#c4a35a]/25 bg-[#0a0908] p-2"
                >
                  <div className="relative aspect-square overflow-hidden bg-black/40">
                    <Image
                      src={item.previewUrl}
                      alt={item.file.name}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                  <p className="mt-2 text-[0.65rem] text-[#a89f8e]">
                    {index === 0 ? "Principale" : `Image ${index + 1}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => removePending(item.key)}
                    className="mt-1 text-xs text-red-300"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-4 border border-[#c4a35a]/20 bg-[#12100e] p-4 sm:p-6"
      >
        <label className="block text-sm">
          Nom *
          <input
            value={nameFr}
            onChange={(e) => {
              setNameFr(e.target.value);
              if (!initial?.id) setSlug(slugify(e.target.value));
            }}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            required
          />
        </label>
        <label className="block text-sm">
          Slug *
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            required
          />
        </label>
        <div className="block text-sm">
          <span className="mb-1 block">Catégorie *</span>
          <AdminSelect
            aria-label="Catégorie"
            value={categoryId}
            onChange={setCategoryId}
            options={categories.map((c) => ({ value: c.id, label: c.nameFr }))}
          />
        </div>
        <label className="block text-sm">
          Prix (€) *
          <input
            value={priceEuro}
            onChange={(e) => setPriceEuro(e.target.value)}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
            required
          />
        </label>
        <label className="block text-sm">
          Description courte
          <input
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            maxLength={180}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Ordre d&apos;affichage
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="mt-1 w-full border border-[#c4a35a]/25 bg-transparent px-3 py-2"
          />
        </label>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            Incontournable
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
            />
            Disponible
          </label>
        </div>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
        <div className="flex gap-3">
          <button type="submit" disabled={pending} className="btn-gold">
            {pending
              ? "Enregistrement…"
              : initial?.id
                ? "Enregistrer"
                : "Créer le produit"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="border border-[#c4a35a]/30 px-4 py-2 text-sm text-[#c4bbaa]"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
