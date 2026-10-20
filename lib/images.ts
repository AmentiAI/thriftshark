import "server-only";
import { del, put } from "@vercel/blob";
import { randomBytes } from "node:crypto";
import { sql } from "@/lib/db";

/**
 * Straight off a phone, a single photo is routinely 3-6MB and an iPhone shoots
 * HEIC, so the old 3MB JPEG-only rule rejected most real uploads. The browser
 * downscales and re-encodes before sending (see components/image-field.tsx);
 * this ceiling is the fallback for anything that arrives un-processed.
 */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"],
  // What iPhones and some Android cameras hand over.
  ["image/heic", "heic"],
  ["image/heif", "heif"],
]);

/** What a file picker should offer, on a laptop or a phone. */
export const UPLOAD_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,.heic,.heif";

function guessTypeFromName(name: string) {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const byExt: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    avif: "image/avif",
    heic: "image/heic",
    heif: "image/heif",
  };
  return byExt[ext] ?? "";
}

export type ImagePurpose = "item" | "logo" | "banner" | "cashapp-qr";

export type UploadResult =
  | { ok: true; id: number; url: string }
  | { ok: false; error: string };

export type StoredImage = {
  mime: string;
  byte_size: number;
  /** Public Vercel Blob URL when stored in Blob. */
  blob_url: string | null;
  /** Legacy Postgres bytea — kept for rows uploaded before Blob. */
  bytes: Buffer | null;
};

function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/**
 * Images are stored in Vercel Blob (public). The `images` row keeps metadata
 * and the blob URL; `/api/images/[id]` redirects to the blob (or serves legacy
 * Postgres bytes for older rows).
 */
export async function storeUpload(
  file: File,
  sellerId: number,
  purpose: ImagePurpose,
): Promise<UploadResult> {
  // Phone pickers variously send no type at all or application/octet-stream,
  // so whenever the reported type is not one we know, trust the extension.
  const reported = file.type.toLowerCase();
  const type = ALLOWED.has(reported) ? reported : guessTypeFromName(file.name);
  if (!ALLOWED.has(type)) {
    return {
      ok: false,
      error: "That file is not an image we can read. JPEG, PNG, WebP, HEIC or GIF.",
    };
  }
  if (file.size === 0) {
    return { ok: false, error: "That file was empty." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `“${file.name}” is ${(file.size / 1024 / 1024).toFixed(1)}MB, over the ${
        MAX_UPLOAD_BYTES / 1024 / 1024
      }MB limit. Try it again on a connection that lets the browser shrink it first.`,
    };
  }

  if (!blobConfigured()) {
    return {
      ok: false,
      error: "Image storage is not configured. Add BLOB_READ_WRITE_TOKEN to the host env.",
    };
  }

  const ext = ALLOWED.get(type) ?? "bin";
  const pathname = `sellers/${sellerId}/${purpose}/${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      contentType: type,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const rows = (await sql.query(
      `insert into images (seller_id, mime, bytes, byte_size, purpose, blob_url)
       values ($1, $2, NULL, $3, $4, $5) returning id`,
      [sellerId, type, file.size, purpose, blob.url],
    )) as { id: number }[];

    return { ok: true, id: rows[0].id, url: blob.url };
  } catch (err) {
    console.error("storeUpload blob failed", err);
    return {
      ok: false,
      error: "Could not upload that image. Try again in a moment.",
    };
  }
}

export async function getImage(id: number): Promise<StoredImage | null> {
  const rows = (await sql`
    select mime, bytes, byte_size, blob_url from images where id = ${id}
  `) as {
    mime: string;
    bytes: Buffer | null;
    byte_size: number;
    blob_url: string | null;
  }[];
  return rows[0] ?? null;
}

/** Public URL for an image id — blob when present, else the local API route. */
export async function getImagePublicUrl(id: number): Promise<string | null> {
  const rows = (await sql`
    select blob_url from images where id = ${id}
  `) as { blob_url: string | null }[];
  const row = rows[0];
  if (!row) return null;
  return row.blob_url ?? `/api/images/${id}`;
}

/** Delete Blob objects for image rows that are about to be removed. */
export async function deleteBlobUrls(urls: (string | null | undefined)[]) {
  const list = urls.filter((u): u is string => Boolean(u && u.startsWith("http")));
  if (list.length === 0 || !blobConfigured()) return;
  try {
    await del(list, { token: process.env.BLOB_READ_WRITE_TOKEN });
  } catch (err) {
    console.error("deleteBlobUrls failed", err);
  }
}
