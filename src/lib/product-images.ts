import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function saveProductImageFile(
  file: File,
  productId: string,
): Promise<{ url: string }> {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Type de fichier non autorisé.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image trop lourde (max 5 Mo).");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = EXT[file.type] || "jpg";
  const name = `${randomBytes(8).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "products", productId);
  await mkdir(dir, { recursive: true });
  const full = path.join(dir, name);
  await writeFile(full, buffer);
  return { url: `/uploads/products/${productId}/${name}` };
}

export async function deleteProductImageFile(url: string) {
  if (!url.startsWith("/uploads/products/")) return;
  const full = path.join(process.cwd(), "public", url.replace(/^\//, ""));
  try {
    await unlink(full);
  } catch {
    // ignore missing
  }
}
