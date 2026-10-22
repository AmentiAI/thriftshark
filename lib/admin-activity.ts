import "server-only";
import { sql } from "@/lib/db";

export type ActivityKind =
  | "shop"
  | "buyer"
  | "listing"
  | "order"
  | "payment"
  | "offer"
  | "bid"
  | "auction"
  | "live"
  | "hunt"
  | "message"
  | "review"
  | "verified";

export const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  shop: "New shop",
  buyer: "New shopper",
  listing: "Listing",
  order: "Order",
  payment: "Paid",
  offer: "Offer",
  bid: "Bid",
  auction: "Auction",
  live: "Live",
  hunt: "Hunt",
  message: "Message",
  review: "Review",
  verified: "Verified",
};

export type ActivityRow = {
  kind: ActivityKind;
  at: string;
  title: string;
  detail: string;
  href: string | null;
};

/**
 * Everything that happened on the marketplace, newest first. Each source is
 * capped before the union so one busy table can't crowd out the rest.
 */
export async function adminActivity(kind: ActivityKind | null, limit = 150): Promise<ActivityRow[]> {
  return (await sql.query(
    `select * from (
       (select 'shop' as kind, s.created_at as at,
               s.shop_name as title,
               '@' || s.handle || ' · ' || s.email as detail,
               '/admin/sellers' as href
        from sellers s order by s.created_at desc limit 40)
       union all
       (select 'buyer', b.created_at, b.name, b.email, null
        from buyers b order by b.created_at desc limit 40)
       union all
       (select 'listing', i.created_at, i.title,
               coalesce(s.shop_name, 'No shop') || ' · $' || to_char(i.price_cents / 100.0, 'FM999999990.00') || ' · ' || i.status,
               '/item/' || i.slug
        from items i left join sellers s on s.id = i.seller_id
        where not i.live_only
        order by i.created_at desc limit 40)
       union all
       (select 'order', o.created_at, 'Order ' || o.order_number,
               o.customer_name || ' · ' || coalesce(s.shop_name, 'No shop') || ' · $' || to_char(o.total_cents / 100.0, 'FM999999990.00') || ' · ' || o.payment_status,
               '/admin/orders'
        from orders o left join sellers s on s.id = o.seller_id
        order by o.created_at desc limit 40)
       union all
       (select 'payment', coalesce(o.paid_at, o.created_at), 'Paid ' || o.order_number,
               o.customer_name || ' paid ' || coalesce(s.shop_name, 'a shop') || ' $' || to_char(o.total_cents / 100.0, 'FM999999990.00'),
               '/admin/payments'
        from orders o left join sellers s on s.id = o.seller_id
        where o.payment_status = 'paid'
        order by coalesce(o.paid_at, o.created_at) desc limit 40)
       union all
       (select 'offer', f.created_at, coalesce(b.name, fs.shop_name, 'Someone') || ' offered $' || to_char(f.amount_cents / 100.0, 'FM999999990.00'),
               i.title || ' · ' || coalesce(s.shop_name, '') || ' · ' || f.status,
               '/item/' || i.slug
        from offers f
        join items i on i.id = f.item_id
        left join sellers s on s.id = i.seller_id
        left join buyers b on b.id = f.from_buyer_id
        left join sellers fs on fs.id = f.from_seller_id
        order by f.created_at desc limit 40)
       union all
       (select 'bid', bd.created_at, bd.bidder_name || ' bid $' || to_char(bd.amount_cents / 100.0, 'FM999999990.00'),
               i.title || ' · ' || coalesce(s.shop_name, '') || ' · ' || bd.bidder_email,
               '/auctions/' || a.id
        from bids bd
        join auctions a on a.id = bd.auction_id
        join items i on i.id = a.item_id
        left join sellers s on s.id = a.seller_id
        order by bd.created_at desc limit 40)
       union all
       (select 'auction', a.settled_at,
               case when a.status = 'sold' then 'Sold at auction: ' else 'Auction closed: ' end || i.title,
               coalesce(s.shop_name, '') || ' · ' || a.status,
               '/auctions/' || a.id
        from auctions a
        join items i on i.id = a.item_id
        left join sellers s on s.id = a.seller_id
        where a.settled_at is not null
        order by a.settled_at desc limit 40)
       union all
       (select 'live', l.started_at, s.shop_name || ' went live',
               l.title || ' · ' || l.status ||
                 case when l.ended_at is not null then ' · ended ' || to_char(l.ended_at at time zone 'UTC', 'Mon DD HH24:MI') || ' UTC' else '' end,
               '/live/' || l.id
        from live_shows l join sellers s on s.id = l.seller_id
        where l.started_at is not null
        order by l.started_at desc limit 40)
       union all
       (select 'hunt', h.created_at, h.title,
               coalesce(b.name, s.shop_name, 'Someone') || ' · ' || h.status,
               '/hunts'
        from hunts h
        left join buyers b on b.id = h.buyer_id
        left join sellers s on s.id = h.seller_id
        order by h.created_at desc limit 40)
       union all
       (select 'message', m.created_at,
               case when m.sender = 'buyer' then t.buyer_name || ' → ' || s.shop_name
                    else s.shop_name || ' → ' || t.buyer_name end,
               left(m.body, 140),
               '/admin/messages/' || t.id
        from dm_messages m
        join dm_threads t on t.id = m.thread_id
        join sellers s on s.id = t.seller_id
        order by m.created_at desc limit 40)
       union all
       (select 'review', r.created_at, r.rating || '★ for ' || s.shop_name,
               r.reviewer_name || coalesce(' · ' || left(r.body, 120), ''),
               '/shop/' || s.handle
        from seller_reviews r join sellers s on s.id = r.seller_id
        order by r.created_at desc limit 40)
       union all
       (select 'verified', p.created_at, s.shop_name || ' paid for Verified', s.email, '/admin/sellers'
        from verified_payments p join sellers s on s.id = p.seller_id
        order by p.created_at desc limit 20)
       union all
       (select 'verified', p.created_at, b.name || ' paid for buyer Verified', b.email, null
        from buyer_verified_payments p join buyers b on b.id = p.buyer_id
        order by p.created_at desc limit 20)
     ) feed
     where ($1::text is null or feed.kind = $1::text)
     order by feed.at desc
     limit $2::int`,
    [kind, limit],
  )) as ActivityRow[];
}

/** Headline counts across the whole marketplace. */
export async function adminPulse() {
  const rows = (await sql`
    select
      (select count(*)::int from buyers where status = 'active')                         as buyers,
      (select count(*)::int from buyers where created_at > now() - interval '7 days')    as buyers_7d,
      (select count(*)::int from sellers where created_at > now() - interval '7 days')   as shops_7d,
      (select count(*)::int from live_shows where status = 'live')                       as live_now,
      (select count(*)::int from auctions where status = 'live')                         as open_auctions,
      (select count(*)::int from bids where created_at > now() - interval '24 hours')    as bids_24h,
      (select count(*)::int from offers where status = 'pending')                        as pending_offers,
      (select count(*)::int from hunts where status = 'open')                            as open_hunts,
      (select count(*)::int from orders where payment_status = 'pending')                as unpaid_orders,
      (select count(*)::int from orders
        where payment_status = 'paid' and created_at > now() - interval '7 days')        as paid_7d,
      (select coalesce(sum(total_cents), 0)::int from orders
        where payment_status = 'paid' and created_at > now() - interval '7 days')        as paid_7d_cents,
      (select count(*)::int from sellers where identity_status <> 'verified')            as unchecked_shops
  `) as {
    buyers: number;
    buyers_7d: number;
    shops_7d: number;
    live_now: number;
    open_auctions: number;
    bids_24h: number;
    pending_offers: number;
    open_hunts: number;
    unpaid_orders: number;
    paid_7d: number;
    paid_7d_cents: number;
    unchecked_shops: number;
  }[];
  return rows[0];
}
