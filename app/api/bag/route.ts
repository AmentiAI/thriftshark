import { NextResponse } from "next/server";
import { getItemsByIds } from "@/lib/queries";

/** Fresh prices and availability for the ids a visitor keeps in local storage. */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 50);

  const items = await getItemsByIds(ids);

  // Preserve the order the visitor added them in.
  const byId = new Map(items.map((i) => [i.id, i]));
  const ordered = ids.map((id) => byId.get(id)).filter((i) => i !== undefined);

  return NextResponse.json(
    { items: ordered },
    { headers: { "cache-control": "no-store" } },
  );
}
