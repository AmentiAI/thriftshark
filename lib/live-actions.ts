"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/live-crypto";
import { settleDueAuctions } from "@/lib/auctions";
import {
  hostIdentity,
  livekitConfigured,
  mintShowToken,
  startCameraEgress,
  stopCameraEgress,
} from "@/lib/livekit";
import { currentBuyer } from "@/lib/buyer-account";
import { storeUpload } from "@/lib/images";
import { isSellerVerified } from "@/lib/seller-plan";
import { currentSeller, requireSeller } from "@/lib/seller-auth";
import { sellerIdVerified } from "@/lib/stripe-identity";
import type { FormState } from "@/lib/actions";

const text = (value: FormDataEntryValue | null) => (typeof value === "string" ? value.trim() : "");

async function readySeller() {
  const seller = await requireSeller();
  if (!sellerIdVerified(seller)) {
    return { seller, error: "Verify your ID with Stripe before this shop can go live." as const };
  }
  if (!isSellerVerified(seller)) {
    return { seller, error: "Live shows are a Verified perk — pay $20 for 30 days on the Verified tab." as const };
  }
  return { seller, error: null };
}

function rtmpUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "rtmp:" && url.protocol !== "rtmps:") return null;
  return raw.replace(/\/+$/, "");
}

function showTitle(shopName: string, raw: string) {
  const chosen = raw.slice(0, 80);
  if (chosen.length >= 3) return chosen;
  const shop = shopName.trim().slice(0, 80);
  return shop.length >= 3 ? shop : "Live now";
}

function isUniqueViolation(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message : "";
  return code === "23505" || message.includes("duplicate key");
}

/** Opens the shop's show on Thrift Sharks. An existing live show is reused. */
async function beginShow(sellerId: number, shopName: string, title: string, coverImageId: number) {
  const existing = (await sql`
    select id from live_shows
    where seller_id = ${sellerId} and status = 'live'
    limit 1
  `) as { id: number }[];
  if (existing[0]) return existing[0].id;

  try {
    const rows = (await sql`
      insert into live_shows (seller_id, title, status, started_at, cover_image_id)
      values (${sellerId}, ${showTitle(shopName, title)}, 'live', now(), ${coverImageId})
      returning id
    `) as { id: number }[];
    return rows[0].id;
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const again = (await sql`
      select id from live_shows
      where seller_id = ${sellerId} and status = 'live'
      limit 1
    `) as { id: number }[];
    if (again[0]) return again[0].id;
    throw error;
  }
}

function refreshShow(showId: number) {
  revalidatePath("/");
  revalidatePath("/dashboard/shows");
  revalidatePath("/live");
  revalidatePath(`/live/${showId}`);
  revalidatePath(`/dashboard/shows/${showId}`);
}

/** One step: the shop is live on Thrift Sharks. Social streams are not started. */
export async function goLiveNow(_prev: FormState, formData: FormData): Promise<FormState> {
  const seller = await currentSeller();
  if (!seller) redirect("/login?next=/dashboard/shows");
  if (!sellerIdVerified(seller) || !isSellerVerified(seller)) {
    return { error: "Live shows need a verified ID and the Verified plan." };
  }

  const existing = (await sql`
    select id from live_shows
    where seller_id = ${seller.id} and status = 'live'
    limit 1
  `) as { id: number }[];
  if (existing[0]) {
    refreshShow(existing[0].id);
    redirect(`/dashboard/shows/${existing[0].id}`);
  }

  const file = formData.get("cover");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Add a thumbnail before you go live. It shows on the live card." };
  }
  const uploaded = await storeUpload(file, seller.id, "cover");
  if (!uploaded.ok) return { error: uploaded.error };

  const showId = await beginShow(seller.id, seller.shop_name, "", uploaded.id);
  refreshShow(showId);
  redirect(`/dashboard/shows/${showId}`);
}

export async function addShowLot(formData: FormData) {
  const ready = await readySeller();
  if (ready.error) return;
  const showId = Number(text(formData.get("show_id")));
  const auctionId = Number(text(formData.get("auction_id")));
  if (!Number.isInteger(showId) || !Number.isInteger(auctionId)) return;

  const shows = (await sql`
    select id, status from live_shows
    where id = ${showId} and seller_id = ${ready.seller.id} and status <> 'ended'
  `) as { id: number; status: string }[];
  if (!shows[0]) return;

  const owned = (await sql`
    select id from auctions
    where id = ${auctionId} and seller_id = ${ready.seller.id} and status = 'live'
  `) as { id: number }[];
  if (!owned[0]) return;

  const next = (await sql`
    select coalesce(max(position), 0) + 1 as position
    from live_show_lots where show_id = ${showId}
  `) as { position: number }[];

  await sql`
    insert into live_show_lots (show_id, auction_id, position)
    values (${showId}, ${auctionId}, ${next[0].position})
    on conflict (auction_id) do nothing
  `;
  if (shows[0].status === "live") {
    await sql`
      update live_shows
      set current_auction_id = ${auctionId}
      where id = ${showId} and seller_id = ${ready.seller.id} and status = 'live'
    `;
  }
  revalidatePath(`/dashboard/shows/${showId}`);
  revalidatePath(`/live/${showId}`);
}

export async function removeShowLot(formData: FormData) {
  const seller = await requireSeller();
  const showId = Number(text(formData.get("show_id")));
  const auctionId = Number(text(formData.get("auction_id")));
  if (!Number.isInteger(showId) || !Number.isInteger(auctionId)) return;
  await sql`
    delete from live_show_lots l
    using live_shows s
    where l.show_id = s.id
      and s.id = ${showId}
      and s.seller_id = ${seller.id}
      and s.status = 'draft'
      and l.auction_id = ${auctionId}
  `;
  revalidatePath(`/dashboard/shows/${showId}`);
}

export async function startLiveShow(formData: FormData) {
  const seller = await currentSeller();
  if (!seller) redirect("/login?next=/dashboard/shows");
  if (!sellerIdVerified(seller) || !isSellerVerified(seller)) redirect("/dashboard/shows");
  const showId = Number(text(formData.get("show_id")));
  if (!Number.isInteger(showId)) redirect("/dashboard/shows");

  const rows = (await sql`
    select status from live_shows
    where id = ${showId} and seller_id = ${seller.id}
  `) as { status: string }[];
  if (!rows[0]) redirect("/dashboard/shows");
  if (rows[0].status === "live") redirect(`/dashboard/shows/${showId}`);
  if (rows[0].status !== "draft") redirect("/dashboard/shows");

  try {
    await sql`
      update live_shows
      set status = 'live', started_at = now()
      where id = ${showId} and seller_id = ${seller.id} and status = 'draft'
    `;
  } catch {
    redirect(`/dashboard/shows/${showId}`);
  }
  refreshShow(showId);
  redirect(`/dashboard/shows/${showId}`);
}

const LIVE_SECONDS = new Set([30, 60, 120, 300]);

function pieceSlug(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "piece"}-${randomBytes(3).toString("hex")}`;
}

/** Names a piece on this live show, sets its starting price, and opens bidding. It is not a rack listing. */
export async function openShowLot(_prev: FormState, formData: FormData): Promise<FormState> {
  const ready = await readySeller();
  if (ready.error) return { error: ready.error };
  const showId = Number(text(formData.get("show_id")));
  const title = text(formData.get("title")).slice(0, 80);
  const seconds = Number(text(formData.get("seconds")));
  const start = Math.round(Number(text(formData.get("start_price")).replace(/[^0-9.]/g, "")) * 100);
  const incrementRaw = text(formData.get("increment"));
  const increment = incrementRaw
    ? Math.round(Number(incrementRaw.replace(/[^0-9.]/g, "")) * 100)
    : 100;
  if (!Number.isInteger(showId)) return { error: "This show is not open." };
  if (title.length < 2) return { error: "Name the piece you are holding up." };
  if (!LIVE_SECONDS.has(seconds)) return { error: "Pick a clock of 30 seconds, 1 minute, 2 minutes, or 5 minutes." };
  if (!Number.isInteger(start) || start < 100) return { error: "Starting bid has to be at least $1." };
  if (!Number.isInteger(increment) || increment < 100) return { error: "The bid step has to be at least $1." };

  const shows = (await sql`
    select s.current_auction_id, a.status as auction_status, a.ends_at
    from live_shows s
    left join auctions a on a.id = s.current_auction_id
    where s.id = ${showId} and s.seller_id = ${ready.seller.id} and s.status = 'live'
  `) as { current_auction_id: number | null; auction_status: string | null; ends_at: string | null }[];
  const show = shows[0];
  if (!show) return { error: "Go live on camera before you start a piece." };
  if (
    show.auction_status === "live" &&
    show.ends_at &&
    new Date(show.ends_at).getTime() > Date.now()
  ) {
    return { error: "This piece is still open. Close it, or wait for the clock, then name the next one." };
  }

  const slug = pieceSlug(title);
  const opened = (await sql`
    with show as (
      select s.id
      from live_shows s
      left join auctions a on a.id = s.current_auction_id
      where s.id = ${showId}
        and s.seller_id = ${ready.seller.id}
        and s.status = 'live'
        and (a.id is null or a.status <> 'live' or a.ends_at <= now())
    ),
    piece as (
      insert into items (
        slug, title, description, price_cents, condition, status, seller_id, hunt_matched, live_only
      )
      select ${slug}, ${title}, '', ${start}, 'good', 'auction', ${ready.seller.id}, true, true
      from show
      returning id
    ),
    created as (
      insert into auctions (item_id, seller_id, start_cents, increment_cents, ends_at)
      select piece.id, ${ready.seller.id}, ${start}, ${increment},
             now() + make_interval(secs => ${seconds})
      from piece
      returning id
    ),
    queued as (
      insert into live_show_lots (show_id, auction_id, position)
      select ${showId}, created.id,
             (select coalesce(max(position), 0) + 1 from live_show_lots where show_id = ${showId})
      from created
      returning auction_id
    )
    update live_shows
    set current_auction_id = (select auction_id from queued)
    where id = ${showId}
      and seller_id = ${ready.seller.id}
      and status = 'live'
      and (select auction_id from queued) is not null
    returning current_auction_id
  `) as { current_auction_id: number }[];

  if (!opened[0]) {
    return { error: "This piece is still open. Close it, or wait for the clock, then name the next one." };
  }

  revalidatePath(`/live/${showId}`);
  revalidatePath(`/dashboard/shows/${showId}`);
  revalidatePath("/live");
  revalidatePath("/auctions");
  revalidatePath("/shop");
  revalidatePath(`/shop/${ready.seller.handle}`);
  return { ok: "Auction is open. Bids show in the comments until the countdown hits zero." };
}

export async function advanceShowLot(formData: FormData) {
  const seller = await requireSeller();
  const showId = Number(text(formData.get("show_id")));
  if (!Number.isInteger(showId)) return;
  const next = (await sql`
    select l.auction_id
    from live_show_lots l
    join auctions a on a.id = l.auction_id and a.status = 'live' and a.ends_at > now()
    join live_shows s on s.id = l.show_id
    where s.id = ${showId}
      and s.seller_id = ${seller.id}
      and s.status = 'live'
      and l.auction_id is distinct from s.current_auction_id
    order by l.position
    limit 1
  `) as { auction_id: number }[];
  if (!next[0]) return;
  await sql`
    update live_shows
    set current_auction_id = ${next[0].auction_id}
    where id = ${showId} and seller_id = ${seller.id} and status = 'live'
  `;
  revalidatePath(`/live/${showId}`);
  revalidatePath(`/dashboard/shows/${showId}`);
}

export async function closeShowLot(formData: FormData) {
  const seller = await requireSeller();
  const showId = Number(text(formData.get("show_id")));
  if (!Number.isInteger(showId)) return;
  const rows = (await sql`
    select current_auction_id
    from live_shows
    where id = ${showId} and seller_id = ${seller.id} and status = 'live'
  `) as { current_auction_id: number | null }[];
  const auctionId = rows[0]?.current_auction_id;
  if (!auctionId) return;
  await sql`
    update auctions
    set ends_at = now()
    where id = ${auctionId} and seller_id = ${seller.id} and status = 'live'
  `;
  await settleDueAuctions(auctionId);
  revalidatePath(`/live/${showId}`);
  revalidatePath(`/auctions/${auctionId}`);
  revalidatePath(`/dashboard/shows/${showId}`);
}

export async function endLiveShow(formData: FormData) {
  const seller = await requireSeller();
  const showId = Number(text(formData.get("show_id")));
  if (!Number.isInteger(showId)) return;
  const outputs = (await sql`
    select o.egress_id
    from live_show_outputs o
    join live_shows s on s.id = o.show_id
    where s.id = ${showId} and s.seller_id = ${seller.id} and o.egress_id is not null
  `) as { egress_id: string }[];
  for (const output of outputs) {
    try {
      if (livekitConfigured()) await stopCameraEgress(output.egress_id);
    } catch (err) {
      console.error("stop egress failed", err);
    }
  }
  await sql`
    update live_show_outputs o
    set status = 'stopped'
    from live_shows s
    where o.show_id = s.id and s.id = ${showId} and s.seller_id = ${seller.id}
      and o.status in ('starting','live')
  `;
  await sql`
    update live_shows
    set status = 'ended', ended_at = now()
    where id = ${showId} and seller_id = ${seller.id} and status = 'live'
  `;
  revalidatePath("/live");
  revalidatePath(`/live/${showId}`);
  revalidatePath(`/dashboard/shows/${showId}`);
  revalidatePath("/dashboard/shows");
}

export async function saveLiveDestination(_prev: FormState, formData: FormData): Promise<FormState> {
  const ready = await readySeller();
  if (ready.error) return { error: ready.error };
  const platform = text(formData.get("platform"));
  if (platform !== "youtube" && platform !== "instagram") {
    return { error: "Pick YouTube or Instagram." };
  }
  const url = rtmpUrl(text(formData.get("rtmp_url")));
  if (!url) return { error: "The server URL should start with rtmp:// or rtmps://." };
  const key = text(formData.get("stream_key"));
  if (key.length < 4 || /\s/.test(key)) return { error: "Paste the stream key with no spaces." };
  const label = text(formData.get("label")).slice(0, 40);
  await sql`
    insert into live_destinations (seller_id, platform, label, rtmp_url, stream_key_cipher)
    values (${ready.seller.id}, ${platform}, ${label}, ${url}, ${encryptSecret(key)})
  `;
  revalidatePath("/dashboard/shows");
  return { ok: "Destination saved. The stream key is stored encrypted." };
}

export async function deleteLiveDestination(formData: FormData) {
  const seller = await requireSeller();
  const id = Number(text(formData.get("id")));
  if (!Number.isInteger(id)) return;
  await sql`
    delete from live_destinations
    where id = ${id} and seller_id = ${seller.id}
  `;
  revalidatePath("/dashboard/shows");
}

/** Optional. Sends the camera that is already live on Thrift Sharks to saved social destinations. */
export async function sendShowOut(_prev: FormState, formData: FormData): Promise<FormState> {
  const showId = Number(text(formData.get("show_id")));
  if (!Number.isInteger(showId)) return { error: "This show is not live." };
  return pushShowDestinations(showId);
}

/** Start one egress per saved destination. One failure does not stop the others. */
export async function pushShowDestinations(showId: number): Promise<FormState> {
  try {
    const seller = await requireSeller();
    if (!livekitConfigured()) {
      return {
        error:
          "Thrift Sharks is already live. YouTube and Instagram need the video server before they can receive the camera.",
      };
    }
    const shows = (await sql`
      select id from live_shows
      where id = ${showId} and seller_id = ${seller.id} and status = 'live'
    `) as { id: number }[];
    if (!shows[0]) return { error: "Start the show before sending it out." };

    const destinations = (await sql`
      select id, rtmp_url, stream_key_cipher, platform
      from live_destinations
      where seller_id = ${seller.id}
    `) as { id: number; rtmp_url: string; stream_key_cipher: string; platform: string }[];
    if (destinations.length === 0) {
      return { error: "Add a YouTube or Instagram stream key first. Thrift Sharks stays live either way." };
    }

    let live = 0;
    let failed = 0;
    for (const destination of destinations) {
      await sql`
        delete from live_show_outputs
        where show_id = ${showId} and destination_id = ${destination.id} and status = 'failed'
      `;
      const claimed = (await sql`
        insert into live_show_outputs (show_id, destination_id, status)
        values (${showId}, ${destination.id}, 'starting')
        on conflict (show_id, destination_id) do nothing
        returning id
      `) as { id: number }[];
      if (!claimed[0]) {
        live += 1;
        continue;
      }
      try {
        const key = decryptSecret(destination.stream_key_cipher);
        const egressId = await startCameraEgress(
          showId,
          hostIdentity(seller.id),
          `${destination.rtmp_url}/${key}`,
        );
        await sql`
          update live_show_outputs
          set status = 'live', egress_id = ${egressId}, error_message = null
          where id = ${claimed[0].id}
        `;
        live += 1;
      } catch (err) {
        failed += 1;
        const message = err instanceof Error ? err.message.slice(0, 240) : "Could not start that output.";
        await sql`
          update live_show_outputs
          set status = 'failed', error_message = ${message}
          where id = ${claimed[0].id}
        `;
        console.error("egress failed", destination.platform, err);
      }
    }
    revalidatePath(`/dashboard/shows/${showId}`);
    if (failed > 0 && live === 0) return { error: "None of the destinations accepted the stream." };
    if (failed > 0) return { ok: `${live} destination${live === 1 ? "" : "s"} live. ${failed} failed — the others kept going.` };
    return { ok: "Sending the camera to your saved destinations." };
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("pushShowDestinations failed", err);
    return { error: "Could not start the social outputs." };
  }
}

export async function viewerShowToken(showId: number) {
  if (!livekitConfigured()) return null;
  const rows = (await sql`
    select id from live_shows where id = ${showId} and status = 'live'
  `) as { id: number }[];
  if (!rows[0]) return null;
  return mintShowToken(`watch-${randomBytes(8).toString("hex")}`, showId, false);
}

async function viewerIdentity() {
  const buyer = await currentBuyer();
  if (buyer) return { buyerId: buyer.id, sellerId: null as number | null, name: buyer.name };
  const seller = await currentSeller();
  if (seller) return { buyerId: null as number | null, sellerId: seller.id, name: seller.shop_name };
  return null;
}

/** The piece currently on a live camera, still open for bids. */
async function openOnCamera(auctionId: number) {
  const rows = (await sql`
    select s.id as show_id
    from live_shows s
    join auctions a on a.id = s.current_auction_id
    where s.status = 'live'
      and a.id = ${auctionId}
      and a.status = 'live'
      and a.ends_at > now()
  `) as { show_id: number }[];
  return rows[0] ?? null;
}

export async function toggleLotLike(formData: FormData) {
  const auctionId = Number(text(formData.get("auction_id")));
  if (!Number.isInteger(auctionId)) return;
  const viewer = await viewerIdentity();
  const stage = await openOnCamera(auctionId);
  if (!viewer || !stage) return;

  if (viewer.buyerId) {
    const removed = (await sql`
      delete from auction_likes
      where auction_id = ${auctionId} and buyer_id = ${viewer.buyerId}
      returning id
    `) as { id: number }[];
    if (!removed[0]) {
      await sql`
        insert into auction_likes (auction_id, buyer_id)
        values (${auctionId}, ${viewer.buyerId})
        on conflict (auction_id, buyer_id) where buyer_id is not null do nothing
      `;
    }
  } else if (viewer.sellerId) {
    const removed = (await sql`
      delete from auction_likes
      where auction_id = ${auctionId} and seller_id = ${viewer.sellerId}
      returning id
    `) as { id: number }[];
    if (!removed[0]) {
      await sql`
        insert into auction_likes (auction_id, seller_id)
        values (${auctionId}, ${viewer.sellerId})
        on conflict (auction_id, seller_id) where seller_id is not null do nothing
      `;
    }
  }

  revalidatePath(`/live/${stage.show_id}`);
  revalidatePath(`/dashboard/shows/${stage.show_id}`);
}

export async function postLotComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const auctionId = Number(text(formData.get("auction_id")));
  const body = text(formData.get("body")).slice(0, 280);
  if (!Number.isInteger(auctionId)) return { error: "That piece is not on camera." };
  if (body.length < 1) return { error: "Write a comment." };
  const viewer = await viewerIdentity();
  if (!viewer) return { error: "Sign in to comment." };
  const stage = await openOnCamera(auctionId);
  if (!stage) return { error: "That piece is over. Likes and comments are on the one on camera now." };

  const prior = viewer.buyerId
    ? ((await sql`
        select count(*)::int as n from auction_comments
        where auction_id = ${auctionId} and buyer_id = ${viewer.buyerId}
      `) as { n: number }[])
    : ((await sql`
        select count(*)::int as n from auction_comments
        where auction_id = ${auctionId} and seller_id = ${viewer.sellerId}
      `) as { n: number }[]);
  if ((prior[0]?.n ?? 0) >= 8) return { error: "That's enough on this piece. The next one starts fresh." };

  if (viewer.buyerId) {
    await sql`
      insert into auction_comments (auction_id, buyer_id, author_name, body)
      values (${auctionId}, ${viewer.buyerId}, ${viewer.name}, ${body})
    `;
  } else if (viewer.sellerId) {
    await sql`
      insert into auction_comments (auction_id, seller_id, author_name, body)
      values (${auctionId}, ${viewer.sellerId}, ${viewer.name}, ${body})
    `;
  }

  revalidatePath(`/live/${stage.show_id}`);
  revalidatePath(`/dashboard/shows/${stage.show_id}`);
  return { ok: "Posted." };
}

/** A line in the show chat. Works as soon as someone has joined, before a piece is up. */
export async function postShowMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const showId = Number(text(formData.get("show_id")));
  const body = text(formData.get("body")).slice(0, 280);
  if (!Number.isInteger(showId)) return { error: "This live is not open." };
  if (body.length < 1) return { error: "Write a comment." };
  const viewer = await viewerIdentity();
  if (!viewer) return { error: "Sign in to chat." };

  const shows = (await sql`
    select id from live_shows where id = ${showId} and status = 'live'
  `) as { id: number }[];
  if (!shows[0]) return { error: "This live has ended." };

  const prior = viewer.buyerId
    ? ((await sql`
        select count(*)::int as n from live_show_messages
        where show_id = ${showId} and buyer_id = ${viewer.buyerId}
      `) as { n: number }[])
    : ((await sql`
        select count(*)::int as n from live_show_messages
        where show_id = ${showId} and seller_id = ${viewer.sellerId}
      `) as { n: number }[]);
  if ((prior[0]?.n ?? 0) >= 80) return { error: "That's enough for this live." };

  if (viewer.buyerId) {
    await sql`
      insert into live_show_messages (show_id, buyer_id, author_name, body)
      values (${showId}, ${viewer.buyerId}, ${viewer.name}, ${body})
    `;
  } else if (viewer.sellerId) {
    await sql`
      insert into live_show_messages (show_id, seller_id, author_name, body)
      values (${showId}, ${viewer.sellerId}, ${viewer.name}, ${body})
    `;
  }

  revalidatePath(`/live/${showId}`);
  revalidatePath(`/dashboard/shows/${showId}`);
  revalidatePath("/");
  return { ok: "Posted." };
}

export async function hostShowToken(showId: number) {
  const seller = await requireSeller();
  if (!livekitConfigured()) return null;
  const rows = (await sql`
    select id from live_shows
    where id = ${showId} and seller_id = ${seller.id} and status = 'live'
  `) as { id: number }[];
  if (!rows[0]) return null;
  return mintShowToken(hostIdentity(seller.id), showId, true);
}
