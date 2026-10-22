import { NextResponse } from "next/server";
import { currentBuyer } from "@/lib/buyer-account";
import { sql } from "@/lib/db";
import { currentSeller } from "@/lib/seller-auth";

export const dynamic = "force-dynamic";

/** Viewer heartbeat. Keyed by account, so two tabs count as one person. */
export async function POST(request: Request) {
  let body: { showId?: unknown; kind?: unknown };
  try {
    body = (await request.json()) as { showId?: unknown; kind?: unknown };
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const showId = Number(body.showId);
  if (!Number.isInteger(showId) || showId <= 0) return new NextResponse(null, { status: 400 });

  const buyer = await currentBuyer();
  const seller = buyer ? null : await currentSeller();
  if (!buyer && !seller) return new NextResponse(null, { status: 401 });
  const key = buyer ? `b${buyer.id}` : `s${seller!.id}`;

  if (body.kind === "leave") {
    await sql`delete from live_viewers where show_id = ${showId} and viewer_key = ${key}`;
    return new NextResponse(null, { status: 204 });
  }

  await sql`
    insert into live_viewers (show_id, viewer_key, seen_at)
    select s.id, ${key}, now()
    from live_shows s
    where s.id = ${showId} and s.status = 'live'
      and (${seller?.id ?? null}::int is null or s.seller_id <> ${seller?.id ?? null}::int)
    on conflict (show_id, viewer_key) do update set seen_at = now()
  `;
  await sql`
    delete from live_viewers
    where show_id = ${showId} and seen_at < now() - interval '2 minutes'
  `;
  return new NextResponse(null, { status: 204 });
}
