import QRCode from "qrcode";
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
  | { ok: true; id: number }
  | { ok: false; error: string };

/**
 * Images live in Postgres and are served by /api/images/[id]. That keeps the
 * whole marketplace to one dependency — the database — with no bucket to
 * configure. Swap this module for object storage if volume ever demands it.
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

  const bytes = Buffer.from(await file.arrayBuffer());
  const rows = (await sql.query(
    `insert into images (seller_id, mime, bytes, byte_size, purpose)
     values ($1, $2, $3, $4, $5) returning id`,
    [sellerId, type, bytes, bytes.byteLength, purpose],
  )) as { id: number }[];

  return { ok: true, id: rows[0].id };
}

export async function getImage(id: number) {
  const rows = (await sql`
    select mime, bytes, byte_size from images where id = ${id}
  `) as { mime: string; bytes: Buffer; byte_size: number }[];
  return rows[0] ?? null;
}

/** "$shark" / "shark" / "cash.app/$shark" -> "shark" */
export function normaliseCashtag(input: string) {
  return input
    .trim()
    .replace(/^https?:\/\/(www\.)?cash\.app\//i, "")
    .replace(/^\$/, "")
    .replace(/[^A-Za-z0-9_]/g, "")
    .slice(0, 20);
}

export function cashappUrl(cashtag: string) {
  return `https://cash.app/$${normaliseCashtag(cashtag)}`;
}

/**
 * Renders the seller's Cash App link as a scannable PNG and stores it like any
 * other image, so the order page can serve it straight from the database.
 */
export async function generateCashappQr(cashtag: string, sellerId: number) {
  const clean = normaliseCashtag(cashtag);
  if (!clean) return null;

  const png = await QRCode.toBuffer(cashappUrl(clean), {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 640,
    color: { dark: "#0c1b2aff", light: "#ffffffff" },
  });

  const rows = (await sql.query(
    `insert into images (seller_id, mime, bytes, byte_size, purpose)
     values ($1, 'image/png', $2, $3, 'cashapp-qr') returning id`,
    [sellerId, png, png.byteLength],
  )) as { id: number }[];

  return rows[0].id;
}
