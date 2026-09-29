"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type ImageRow = {
  id: string;
  url: string;
  alt: string | null;
  displayOrder: number;
};

type Props = {
  productId: string;
  initialImages: ImageRow[];
};

export function ProductImageManager({ productId, initialImages }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(initialImages);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  async function upload(file: File) {
    if (images.length >= 3) {
      setError("Maximum 3 images par produit.");
      return;
    }
    setPending(true);
    setError(null);
    setProgress("Envoi…");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/admin/products/${productId}/images`, {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    setPending(false);
    setProgress(null);
    if (!res.ok) {
      setError(data.error || "Upload échoué");
      return;
    }
    setImages((prev) =>
      [...prev, data.image].sort(
        (a, b) => a.displayOrder - b.displayOrder,
      ),
    );
    router.refresh();
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    await upload(files[0]);
  }

  async function remove(imageId: string) {
    if (!confirm("Supprimer cette image ?")) return;
    setPending(true);
    setError(null);
    const res = await fetch(
      `/api/admin/products/${productId}/images/${imageId}`,
      { method: "DELETE" },
    );
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Suppression échouée");
      return;
    }
    setImages(data.images || []);
    router.refresh();
  }

  async function replace(imageId: string, file: File) {
    setPending(true);
    setError(null);
    setProgress("Remplacement…");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(
      `/api/admin/products/${productId}/images/${imageId}`,
      { method: "PUT", body: fd },
    );
    const data = await res.json();
    setPending(false);
    setProgress(null);
    if (!res.ok) {
      setError(data.error || "Remplacement échoué");
      return;
    }
    setImages((prev) =>
      prev.map((img) => (img.id === imageId ? data.image : img)),
    );
    router.refresh();
  }

  async function persistOrder(next: ImageRow[]) {
    setImages(next);
    setPending(true);
    const res = await fetch(`/api/admin/products/${productId}/images`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((i) => i.id) }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Réordonnancement échoué");
      return;
    }
    setImages(data.images);
    router.refresh();
  }

  function onDropReorder(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const from = images.findIndex((i) => i.id === dragId);
    const to = images.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void persistOrder(next.map((img, i) => ({ ...img, displayOrder: i })));
    setDragId(null);
  }

  return (
    <section className="border border-[#c4a35a]/20 bg-[#12100e] p-4 sm:p-6">
      <h2 className="text-[0.65rem] uppercase tracking-[0.16em] text-[#c4a35a]">
        Images
      </h2>
      <p className="mt-1 text-xs text-[#a89f8e]">
        Upload depuis l&apos;ordinateur (JPG, PNG, WEBP, AVIF · max 5 Mo).
        Maximum 3 images. La première est l&apos;image principale.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {images.map((img, index) => (
          <div
            key={img.id}
            draggable
            onDragStart={() => setDragId(img.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDropReorder(img.id)}
            className="relative border border-[#c4a35a]/25 bg-[#0a0908] p-2"
          >
            <div className="relative aspect-square overflow-hidden bg-black/40">
              <Image
                src={img.url}
                alt={img.alt || `Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="200px"
                unoptimized={img.url.startsWith("/uploads/")}
              />
            </div>
            {index === 0 ? (
              <p className="mt-2 text-[0.65rem] uppercase tracking-wider text-[#e0c878]">
                Principale
              </p>
            ) : (
              <p className="mt-2 text-[0.65rem] text-[#a89f8e]">
                Image {index + 1}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <label className="cursor-pointer text-[#c4a35a] hover:text-[#e0c878]">
                Remplacer
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  disabled={pending}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void replace(img.id, f);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                disabled={pending}
                onClick={() => void remove(img.id)}
                className="text-red-300 hover:text-red-200"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 3 - images.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex aspect-square items-center justify-center border border-dashed border-[#c4a35a]/20 text-xs text-[#a89f8e]"
          >
            Emplacement {images.length + i + 1}
          </div>
        ))}
      </div>

      <div
        className="mt-4 border border-dashed border-[#c4a35a]/30 bg-[#0a0908] p-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void onFiles(e.dataTransfer.files);
        }}
      >
        <p className="mb-3 text-xs text-[#a89f8e]">
          Glissez-déposez une image ou cliquez pour importer (pas d&apos;URL).
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending || images.length >= 3}
            onClick={() => inputRef.current?.click()}
            className="border border-[#c4a35a]/40 px-3 py-2 text-sm text-[#e0c878] disabled:opacity-40"
          >
            + Ajouter une image
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => {
              void onFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {images.length >= 3 ? (
            <p className="text-xs text-[#a89f8e]">
              Maximum 3 images par produit.
            </p>
          ) : null}
          {progress ? <p className="text-xs text-[#c4a35a]">{progress}</p> : null}
        </div>
      </div>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
