import { randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_FLAT_CENTS } from "@/lib/types";
import type { Auction } from "@/lib/types";

const AUCTION_COLUMNS = `
  a.id, a.item_id, a.seller_id, a.start_cents, a.reserve_cents, a.increment_cents,
  a.starts_at, a.ends_at, a.status, a.settled_at, a.order_id, a.created_at,
  i.slug as item_slug, i.title as item_title, i.description as item_description,
  i.brand as item_brand, i.item_size, i.condition as item_condition,
  s.handle as seller_handle, s.shop_name as seller_shop_name,
  s.logo_image_id as seller_logo_image_id, s.cashapp_tag as seller_cashapp_tag,
  (select count(*)::int from bids b where b.auction_id = a.id)            as bid_count,
  (select max(b.amount_cents)::int from bids b where b.auction_id = a.id) as high_cents,
  (select b.bidder_name from bids b where b.auction_id = a.id
    order by b.amount_cents desc, b.id asc limit 1)                       as high_bidder,
  coalesce(
    (select json_agg(json_build_object('url', im.url, 'image_id', im.image_id, 'alt', im.alt)
            order by im.position, im.id)
     from item_images im where im.item_id = i.id),
    '[]'::json
  ) as images
`;

const AUCTION_FROM = `
  from auctions a
  join items i   on i.id = a.item_id
  join sellers s on s.id = a.seller_id
`;

function orderNumber() {
  const day = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `TS-${day}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

/** The lowest bid an auction will currently accept. */
export function minimumBid(auction: {
  start_cents: number;
  increment_cents: number;
  high_cents: number | null;
}) {
  return auction.high_cents === null
    ? auction.start_cents
    : auction.high_cents + auction.increment_cents;
}

/**
 * Closes any auction whose clock has run out.
 *
 * There is no scheduler here: every page that shows auctions calls this first,
 * so an auction settles on the next visit after it ends. Each auction settles
 * in one statement — the winning bid becomes a real order, the item is marked
 * sold, and an auction that missed its reserve puts the item back on the rack.
 */
export async function settleDueAuctions(auctionId?: number) {
  const due = (await sql.query(
    `select id from auctions
     where status = 'live' and ends_at <= now()
       and ($1::int is null or id = $1::int)
     order by ends_at
     limit 25`,
    [auctionId ?? null],
  )) as { id: number }[];

  for (const { id } of due) {
    await sql.query(
      `with due as (
         select a.id, a.item_id, a.seller_id, a.reserve_cents
         from auctions a
         where a.id = $1 and a.status = 'live' and a.ends_at <= now()
         for update
       ),
       top as (
         select b.bidder_name, b.bidder_email, b.amount_cents
         from bids b join due on due.id = b.auction_id
         order by b.amount_cents desc, b.id asc
         limit 1
       ),
       winner as (
         select t.bidder_name, t.bidder_email, t.amount_cents,
                d.item_id, d.seller_id
         from top t join due d on true
         where t.amount_cents >= coalesce(d.reserve_cents, 0)
       ),
       new_order as (
         insert into orders (order_number, seller_id, group_token, email, customer_name,
           subtotal_cents, shipping_cents, total_cents, fulfilment, notes)
         select $2, w.seller_id, $3, w.bidder_email, w.bidder_name,
                w.amount_cents,
                case when w.amount_cents >= $4::int then 0 else $5::int end,
                w.amount_cents + case when w.amount_cents >= $4::int then 0 else $5::int end,
                'ship',
                'Auction win — buyer still needs to send a shipping address.'
         from winner w
         returning id
       ),
       lines as (
         insert into order_items (order_id, item_id, title, price_cents)
         select (select id from new_order), w.item_id, i.title, w.amount_cents
         from winner w join items i on i.id = w.item_id
         returning 1
       ),
       sold_item as (
         update items set status = 'sold', updated_at = now()
         where id = (select item_id from winner)
         returning 1
       ),
       relisted as (
         update items set status = 'available', updated_at = now()
         where id = (select item_id from due)
           and not exists (select 1 from winner)
         returning 1
       )
       update auctions set
         status = case when exists (select 1 from winner) then 'sold' else 'ended' end,
         order_id = (select id from new_order),
         settled_at = now()
       where id = (select id from due)`,
      [id, orderNumber(), randomBytes(9).toString("base64url"),
       FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_FLAT_CENTS],
    );
  }

  return due.length;
}

export async function listAuctions(filter: "live" | "ended" | "all" = "live") {
  await settleDueAuctions();

  const where =
    filter === "live"
      ? "where a.status = 'live'"
      : filter === "ended"
        ? "where a.status in ('ended','sold')"
        : "where a.status <> 'cancelled'";

  const order =
    filter === "live"
      ? "order by a.ends_at asc"
      : "order by coalesce(a.settled_at, a.ends_at) desc";

  return (await sql.query(
    `select ${AUCTION_COLUMNS} ${AUCTION_FROM} ${where} ${order} limit 60`,
    [],
  )) as Auction[];
}

export async function getAuction(id: number): Promise<Auction | null> {
  await settleDueAuctions(id);
  const rows = (await sql.query(
    `select ${AUCTION_COLUMNS} ${AUCTION_FROM} where a.id = $1`,
    [id],
  )) as Auction[];
  return rows[0] ?? null;
}

export async function getAuctionByItemId(itemId: number): Promise<Auction | null> {
  const rows = (await sql.query(
    `select ${AUCTION_COLUMNS} ${AUCTION_FROM} where a.item_id = $1`,
    [itemId],
  )) as Auction[];
  return rows[0] ?? null;
}

export async function liveAuctions(limit = 4) {
  await settleDueAuctions();
  return (await sql.query(
    `select ${AUCTION_COLUMNS} ${AUCTION_FROM}
     where a.status = 'live'
     order by a.ends_at asc
     limit $1`,
    [limit],
  )) as Auction[];
}

export async function sellerAuctions(sellerId: number) {
  await settleDueAuctions();
  return (await sql.query(
    `select ${AUCTION_COLUMNS} ${AUCTION_FROM}
     where a.seller_id = $1
     order by a.status = 'live' desc, a.ends_at desc
     limit 60`,
    [sellerId],
  )) as Auction[];
}

/** Bid history, newest first. Emails are never exposed to the public page. */
export async function auctionBids(auctionId: number) {
  return (await sql`
    select id, bidder_name, amount_cents, created_at
    from bids where auction_id = ${auctionId}
    order by amount_cents desc, id asc
    limit 50
  `) as { id: number; bidder_name: string; amount_cents: number; created_at: string }[];
}

export async function auctionStats() {
  const rows = (await sql`
    select
      (select count(*)::int from auctions where status = 'live')  as live,
      (select count(*)::int from auctions where status = 'sold')  as sold,
      (select count(*)::int from bids)                            as bids
  `) as { live: number; sold: number; bids: number }[];
  return rows[0];
}
