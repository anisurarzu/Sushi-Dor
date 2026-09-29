import { createHash } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
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

const CLOUD_FOLDER_ROOT = "sushi-dor";

export type UploadResult = {
  url: string;
  provider: "cloudinary" | "local";
  publicId?: string;
};

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export function getImageUploadProvider(): "cloudinary" | "local" {
  return isCloudinaryConfigured() ? "cloudinary" : "local";
}

function cloudinarySignature(params: Record<string, string>, apiSecret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1")
    .update(`${toSign}${apiSecret}`)
    .digest("hex");
}

async function uploadToCloudinary(
  file: File,
  folder: string,
): Promise<UploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = cloudinarySignature({ folder, timestamp }, apiSecret);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("folder", folder);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Cloudinary upload failed: ${details}`);
  }

  const data = (await response.json()) as {
    secure_url: string;
    public_id: string;
  };

  return {
    url: data.secure_url,
    provider: "cloudinary",
    publicId: data.public_id,
  };
}

async function uploadLocally(
  file: File,
  productId: string,
): Promise<UploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = EXT[file.type] || "jpg";
  const name = `${randomBytes(8).toString("hex")}.${ext}`;
  const dir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "products",
    productId,
  );
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);
  return {
    url: `/uploads/products/${productId}/${name}`,
    provider: "local",
  };
}

function validateImage(file: File) {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Type de fichier non autorisé.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image trop lourde (max 5 Mo).");
  }
}

export async function saveProductImageFile(
  file: File,
  productId: string,
): Promise<UploadResult> {
  validateImage(file);
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(
      file,
      `${CLOUD_FOLDER_ROOT}/products/${productId}`,
    );
  }
  return uploadLocally(file, productId);
}

export function getCloudinaryPublicId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("res.cloudinary.com")) return null;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (cloudName && !parsed.pathname.startsWith(`/${cloudName}/`)) {
      return null;
    }

    const uploadIndex = parsed.pathname.indexOf("/upload/");
    if (uploadIndex === -1) return null;

    let remainder = parsed.pathname.slice(uploadIndex + "/upload/".length);
    remainder = remainder.replace(/^v\d+\//, "");
    while (/^[a-z]+_[^/]+(?:,[^/]+)*\//i.test(remainder)) {
      remainder = remainder.replace(/^[a-z]+_[^/]+(?:,[^/]+)*\//i, "");
    }

    const withoutExt = remainder.replace(/\.[a-z0-9]+$/i, "");
    if (!withoutExt.startsWith(`${CLOUD_FOLDER_ROOT}/`)) {
      return null;
    }
    return withoutExt;
  } catch {
    return null;
  }
}

async function destroyCloudinaryAsset(publicId: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = cloudinarySignature(
    { public_id: publicId, timestamp },
    apiSecret,
  );

  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: "POST", body: formData },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Cloudinary delete failed: ${details}`);
  }
}

export async function deleteProductImageFile(url: string) {
  if (url.startsWith("/uploads/products/")) {
    const full = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    const root = path.join(process.cwd(), "public", "uploads", "products");
    if (!full.startsWith(root)) return;
    try {
      await unlink(full);
    } catch {
      // ignore missing
    }
    return;
  }

  if (!isCloudinaryConfigured() || !url.includes("res.cloudinary.com")) {
    return;
  }

  const publicId = getCloudinaryPublicId(url);
  if (!publicId) return;
  try {
    await destroyCloudinaryAsset(publicId);
  } catch {
    // best-effort delete
  }
}

/** Delete every stored image file for a product (Cloudinary + local). */
export async function deleteAllProductImageFiles(
  urls: (string | null | undefined)[],
) {
  const unique = [...new Set(urls.filter(Boolean) as string[])];
  await Promise.all(unique.map((url) => deleteProductImageFile(url)));
}

/**
 * Upload an existing local public/ path or remote image URL into Cloudinary
 * and return the new secure URL.
 */
export async function migrateImageUrlToCloudinary(
  sourceUrl: string,
  productId: string,
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured.");
  }
  if (sourceUrl.includes("res.cloudinary.com")) {
    return sourceUrl;
  }

  let buffer: Buffer;
  let mime = "image/jpeg";
  let filename = "image.jpg";

  if (sourceUrl.startsWith("/")) {
    const full = path.join(process.cwd(), "public", sourceUrl.replace(/^\//, ""));
    const publicRoot = path.join(process.cwd(), "public");
    if (!full.startsWith(publicRoot)) {
      throw new Error(`Invalid image path: ${sourceUrl}`);
    }
    const { readFile } = await import("fs/promises");
    buffer = await readFile(full);
    const ext = path.extname(full).toLowerCase();
    filename = path.basename(full);
    mime =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".avif"
            ? "image/avif"
            : "image/jpeg";
  } else if (sourceUrl.startsWith("http://") || sourceUrl.startsWith("https://")) {
    const res = await fetch(sourceUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${sourceUrl}`);
    }
    buffer = Buffer.from(await res.arrayBuffer());
    mime = res.headers.get("content-type") || "image/jpeg";
    filename = sourceUrl.split("/").pop() || "image.jpg";
  } else {
    throw new Error(`Unsupported image URL: ${sourceUrl}`);
  }

  const file = new File([buffer], filename, { type: mime });
  const uploaded = await uploadToCloudinary(
    file,
    `${CLOUD_FOLDER_ROOT}/products/${productId}`,
  );
  return uploaded.url;
}
