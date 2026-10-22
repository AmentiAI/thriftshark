import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { currentSeller } from "@/lib/seller-auth";

export const dynamic = "force-dynamic";

const tokenPattern = /^[a-zA-Z0-9_-]{8,40}$/;

/** Host tab heartbeat. A leave only counts for the tab that last checked in. */
export async function POST(request: Request) {
  const seller = await currentSeller();
  if (!seller) return new NextResponse(null, { status: 401 });

  let body: { showId?: unknown; token?: unknown; kind?: unknown };
  try {
    body = (await request.json()) as { showId?: unknown; token?: unknown; kind?: unknown };
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const showId = Number(body.showId);
  const tab = typeof body.token === "string" ? body.token : "";
  if (!Number.isInteger(showId) || showId <= 0 || !tokenPattern.test(tab)) {
    return new NextResponse(null, { status: 400 });
  }

  if (body.kind === "pulse") {
    await sql`
      update live_shows
      set host_seen_at = now(), host_gone_at = null, host_token = ${tab}
      where id = ${showId} and seller_id = ${seller.id} and status = 'live'
    `;
  } else if (body.kind === "leave") {
    await sql`
      update live_shows
      set host_gone_at = now()
      where id = ${showId} and seller_id = ${seller.id} and status = 'live'
        and host_token = ${tab}
    `;
  } else {
    return new NextResponse(null, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}
