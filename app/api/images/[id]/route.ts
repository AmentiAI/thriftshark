import { getImage } from "@/lib/images";

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

  // Image rows are never rewritten — a new upload gets a new id — so these can
  // be cached hard.
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "content-type": image.mime,
      "content-length": String(image.byte_size),
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
