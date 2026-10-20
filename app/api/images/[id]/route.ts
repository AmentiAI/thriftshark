import { getImage } from "@/lib/images";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const imageId = Number(id);
  if (!Number.isInteger(imageId) || imageId <= 0) {
    return new Response("Not found", { status: 404 });
  }

  const image = await getImage(imageId);
  if (!image) return new Response("Not found", { status: 404 });

  // Prefer Vercel Blob — permanent CDN URL.
  if (image.blob_url) {
    return NextResponse.redirect(image.blob_url, {
      status: 308,
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  }

  if (!image.bytes) return new Response("Not found", { status: 404 });

  // Legacy Postgres bytea rows.
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "content-type": image.mime,
      "content-length": String(image.byte_size),
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
