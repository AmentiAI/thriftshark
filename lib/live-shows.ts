import { settleDueAuctions } from "@/lib/auctions";
import { sql } from "@/lib/db";
import { money } from "@/lib/format";
import { livekitConfigured, stopCameraEgress } from "@/lib/livekit";

export type LiveShowStatus = "draft" | "live" | "ended";

export type LiveLot = {
  position: number;
  auction_id: number;
  auction_status: string;
  ends_at: string;
  start_cents: number;
  increment_cents: number;
  reserve_cents: number | null;
  title: string;
  item_size: string | null;
  condition: string;
  high_cents: number | null;
  high_bidder: string | null;
  bid_count: number;
  image_id: number | null;
  image_url: string | null;
  like_count: number;
  winner_name: string | null;
  winner_email: string | null;
};

export type LotComment = {
  id: number;
  author_name: string;
  body: string;
  created_at: string;
};

/** One line in the live comment list. Bids are lines in that list, not a separate board. */
export type LotNote = {
  key: string;
  kind: "comment" | "bid";
  author_name: string;
  body: string;
  created_at: string;
};

function stamp(value: string | Date) {
  return value instanceof Date ? value.toISOString() : String(value);
}

/** What the stage says once this piece is no longer open. */
export function lotOutcome(lot: Pick<LiveLot, "auction_status" | "high_bidder" | "high_cents">) {
  if (lot.auction_status === "sold" && lot.high_bidder && lot.high_cents != null) {
    return `Sold to ${lot.high_bidder} for ${money(lot.high_cents)}.`;
  }
  if (lot.auction_status === "live") return null;
  return "No sale";
}

export type LiveShow = {
  id: number;
  seller_id: number;
  title: string;
  status: LiveShowStatus;
  current_auction_id: number | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  seller_handle: string;
  seller_shop_name: string;
  seller_logo_image_id: number | null;
  cover_image_id: number | null;
  screen_text: string | null;
  screen_style: ScreenStyle;
  screen_spot: ScreenSpot;
  pinned_text: string | null;
  /** Only filled on the live list. */
  viewer_count?: number;
  lots: LiveLot[];
};

export type ScreenStyle = "banner" | "headline" | "sticker";
export type ScreenSpot = "top" | "middle" | "low";

export type LiveDestination = {
  id: number;
  platform: "youtube" | "instagram";
  label: string;
  rtmp_url: string;
  created_at: string;
};

export type LiveOutput = {
  destination_id: number;
  platform: "youtube" | "instagram";
  label: string;
  status: string;
  error_message: string | null;
};

const LOT_COLUMNS = `
  l.position, a.id as auction_id, a.status as auction_status, a.ends_at,
  a.start_cents, a.increment_cents, a.reserve_cents,
  i.title, i.item_size, i.condition,
  (select max(b.amount_cents) from bids b where b.auction_id = a.id) as high_cents,
  (select b.bidder_name from bids b where b.auction_id = a.id
    order by b.amount_cents desc, b.id asc limit 1) as high_bidder,
  (select count(*)::int from bids b where b.auction_id = a.id) as bid_count,
  (select im.image_id from item_images im
    where im.item_id = i.id order by im.position, im.id limit 1) as image_id,
  (select im.url from item_images im
    where im.item_id = i.id order by im.position, im.id limit 1) as image_url,
  (select count(*)::int from auction_likes k where k.auction_id = a.id) as like_count,
  o.customer_name as winner_name, o.email as winner_email
`;

async function stopShowEgress(showId: number) {
  const outputs = (await sql`
    select egress_id from live_show_outputs
    where show_id = ${showId} and egress_id is not null
  `) as { egress_id: string }[];
  for (const output of outputs) {
    try {
      if (livekitConfigured()) await stopCameraEgress(output.egress_id);
    } catch (err) {
      console.error("stop egress failed", err);
    }
  }
  await sql`
    update live_show_outputs
    set status = 'stopped'
    where show_id = ${showId} and status in ('starting', 'live')
  `;
}

/** Marks a live show ended and stops any social relay. */
export async function finishLiveShow(showId: number) {
  const ended = (await sql`
    update live_shows
    set status = 'ended', ended_at = now()
    where id = ${showId} and status = 'live'
    returning id
  `) as { id: number }[];
  if (!ended[0]) return false;
  await stopShowEgress(showId);
  return true;
}

/**
 * Ends a show whose host tab is gone. A leave signal waits 12 seconds so a
 * refresh can cancel it. A tab that vanishes without a signal ends after 90s,
 * which still clears Chrome's once-a-minute timer throttling in background tabs.
 */
export async function releaseAbandonedShows() {
  const stale = (await sql`
    update live_shows
    set status = 'ended', ended_at = now()
    where status = 'live'
      and (
        (
          host_gone_at is not null
          and host_gone_at < now() - interval '12 seconds'
          and (host_seen_at is null or host_gone_at > host_seen_at)
        )
        or (
          host_seen_at is not null
          and host_seen_at < now() - interval '90 seconds'
          and (host_gone_at is null or host_seen_at > host_gone_at)
        )
      )
    returning id
  `) as { id: number }[];
  for (const show of stale) await stopShowEgress(show.id);
}

export async function listLiveShows(): Promise<LiveShow[]> {
  await settleDueAuctions();
  await releaseAbandonedShows();
  const shows = (await sql`
    select s.id, s.seller_id, s.title, s.status, s.current_auction_id,
           s.started_at, s.ended_at, s.created_at, s.cover_image_id,
           s.screen_text, s.screen_style, s.screen_spot, s.pinned_text,
           (select count(*)::int from live_viewers v
             where v.show_id = s.id and v.seen_at > now() - interval '30 seconds') as viewer_count,
           sel.handle as seller_handle, sel.shop_name as seller_shop_name,
           sel.logo_image_id as seller_logo_image_id
    from live_shows s
    join sellers sel on sel.id = s.seller_id and sel.status = 'active'
    where s.status = 'live'
    order by s.started_at desc
    limit 12
  `) as Omit<LiveShow, "lots">[];
  return Promise.all(shows.map(async (show) => ({ ...show, lots: await lotsFor(show.id) })));
}

/** People with the live open in the last 30 seconds. The host is not counted. */
export async function viewerCount(showId: number) {
  const rows = (await sql`
    select count(*)::int as n from live_viewers
    where show_id = ${showId} and seen_at > now() - interval '30 seconds'
  `) as { n: number }[];
  return rows[0]?.n ?? 0;
}

export async function sellerShows(sellerId: number) {
  await releaseAbandonedShows();
  return (await sql`
    select id, title, status, current_auction_id, started_at, ended_at, created_at
    from live_shows
    where seller_id = ${sellerId}
    order by created_at desc
    limit 30
  `) as {
    id: number;
    title: string;
    status: LiveShowStatus;
    current_auction_id: number | null;
    started_at: string | null;
    ended_at: string | null;
    created_at: string;
  }[];
}

export async function getShow(id: number): Promise<LiveShow | null> {
  await settleDueAuctions();
  await releaseAbandonedShows();
  const rows = (await sql`
    select s.id, s.seller_id, s.title, s.status, s.current_auction_id,
           s.started_at, s.ended_at, s.created_at, s.cover_image_id,
           s.screen_text, s.screen_style, s.screen_spot, s.pinned_text,
           sel.handle as seller_handle, sel.shop_name as seller_shop_name,
           sel.logo_image_id as seller_logo_image_id
    from live_shows s
    join sellers sel on sel.id = s.seller_id
    where s.id = ${id}
  `) as Omit<LiveShow, "lots">[];
  const show = rows[0];
  if (!show) return null;
  return { ...show, lots: await lotsFor(show.id) };
}

async function lotsFor(showId: number): Promise<LiveLot[]> {
  return (await sql.query(
    `select ${LOT_COLUMNS}
     from live_show_lots l
     join auctions a on a.id = l.auction_id
     join items i on i.id = a.item_id
     left join orders o on o.id = a.order_id
     where l.show_id = $1
     order by l.position`,
    [showId],
  )) as LiveLot[];
}

/** Destinations for the owning shop. Never includes the stream key. */
export async function sellerDestinations(sellerId: number): Promise<LiveDestination[]> {
  return (await sql`
    select id, platform, label, rtmp_url, created_at
    from live_destinations
    where seller_id = ${sellerId}
    order by created_at desc
  `) as LiveDestination[];
}

/** Likes, comments, and bids for this auction only. The next piece is a new auction, so the list starts over. */
export async function lotCrowd(
  auctionId: number,
  viewer: { buyerId: number | null; sellerId: number | null },
) {
  const counts = (await sql`
    select count(*)::int as likes from auction_likes where auction_id = ${auctionId}
  `) as { likes: number }[];
  const comments = (await sql`
    select id, author_name, body, created_at
    from auction_comments
    where auction_id = ${auctionId}
    order by created_at desc
    limit 40
  `) as LotComment[];
  const bidRows = (await sql`
    select id, bidder_name, amount_cents, created_at
    from bids
    where auction_id = ${auctionId}
    order by created_at desc
    limit 40
  `) as { id: number; bidder_name: string; amount_cents: number; created_at: string | Date }[];
  const notes: LotNote[] = [
    ...comments.map((comment) => ({
      key: `c-${comment.id}`,
      kind: "comment" as const,
      author_name: comment.author_name,
      body: comment.body,
      created_at: stamp(comment.created_at),
    })),
    ...bidRows.map((bid) => ({
      key: `b-${bid.id}`,
      kind: "bid" as const,
      author_name: bid.bidder_name,
      body: `bid ${money(Number(bid.amount_cents))}`,
      created_at: stamp(bid.created_at),
    })),
  ]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-40);
  let liked = false;
  if (viewer.buyerId) {
    const rows = (await sql`
      select 1 as ok from auction_likes
      where auction_id = ${auctionId} and buyer_id = ${viewer.buyerId}
    `) as unknown[];
    liked = rows.length > 0;
  } else if (viewer.sellerId) {
    const rows = (await sql`
      select 1 as ok from auction_likes
      where auction_id = ${auctionId} and seller_id = ${viewer.sellerId}
    `) as unknown[];
    liked = rows.length > 0;
  }
  return { likes: counts[0]?.likes ?? 0, liked, notes };
}

/** Show chat, plus bids (and comments) on the piece that is up right now. */
export async function showChat(showId: number, auctionId: number | null): Promise<LotNote[]> {
  const messages = (await sql`
    select id, author_name, body, created_at
    from live_show_messages
    where show_id = ${showId}
    order by created_at desc
    limit 80
  `) as LotComment[];
  const notes: LotNote[] = messages.map((message) => ({
    key: `m-${message.id}`,
    kind: "comment" as const,
    author_name: message.author_name,
    body: message.body,
    created_at: stamp(message.created_at),
  }));

  if (auctionId) {
    const comments = (await sql`
      select id, author_name, body, created_at
      from auction_comments
      where auction_id = ${auctionId}
      order by created_at desc
      limit 40
    `) as LotComment[];
    const bidRows = (await sql`
      select id, bidder_name, amount_cents, created_at
      from bids
      where auction_id = ${auctionId}
      order by created_at desc
      limit 40
    `) as { id: number; bidder_name: string; amount_cents: number; created_at: string | Date }[];
    for (const comment of comments) {
      notes.push({
        key: `c-${comment.id}`,
        kind: "comment",
        author_name: comment.author_name,
        body: comment.body,
        created_at: stamp(comment.created_at),
      });
    }
    for (const bid of bidRows) {
      notes.push({
        key: `b-${bid.id}`,
        kind: "bid",
        author_name: bid.bidder_name,
        body: `bid ${money(Number(bid.amount_cents))}`,
        created_at: stamp(bid.created_at),
      });
    }
  }

  return notes
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-60);
}

export async function showOutputs(showId: number): Promise<LiveOutput[]> {
  return (await sql`
    select o.destination_id, d.platform, d.label, o.status, o.error_message
    from live_show_outputs o
    join live_destinations d on d.id = o.destination_id
    where o.show_id = ${showId}
    order by d.platform, d.id
  `) as LiveOutput[];
}
