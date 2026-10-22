import { sql } from "@/lib/db";
import { releaseDueDrops } from "@/lib/hunt-match";
import type {
  Category,
  DmMessage,
  DmThread,
  Item,
  Message,
  Order,
  Seller,
  SellerCard,
  SellerReview,
  WeeklyTopShop,
} from "@/lib/types";

const ITEM_COLUMNS = `
  i.id, i.slug, i.title, i.description, i.price_cents, i.compare_at_cents,
  i.category_id, i.brand, i.item_size, i.condition, i.color, i.status,
  i.chest_in, i.waist_in, i.inseam_in, i.shoe_size, i.drops_at,
  i.featured, i.created_at, i.seller_id,
  c.name as category_name, c.slug as category_slug,
  s.handle as seller_handle, s.shop_name as seller_shop_name,
  s.logo_image_id as seller_logo_image_id,
  (s.official or s.verified_until > now()) as seller_verified,
  (coalesce(s.identity_status, 'verified') = 'verified') as seller_identity_checked,
  coalesce(
    (select json_agg(json_build_object('id', im.id, 'url', im.url, 'image_id', im.image_id, 'alt', im.alt)
            order by im.position, im.id)
     from item_images im where im.item_id = i.id),
    '[]'::json
  ) as images
`;

/** Items only reach the storefront through a shop that is still active. */
const ITEM_FROM = `
  from items i
  left join categories c on c.id = i.category_id
  join sellers s on s.id = i.seller_id and s.status = 'active'
`;

const SELLER_CARD_COLUMNS = `
  s.id, s.handle, s.shop_name, s.tagline, s.bio, s.location,
  s.logo_image_id, s.banner_image_id, s.featured, s.created_at,
  s.banner_x, s.banner_y, s.logo_x, s.logo_y,
  (s.official or s.verified_until > now()) as verified,
  (coalesce(s.identity_status, 'verified') = 'verified') as identity_checked,
  (
    select case when count(*) >= 2
      then round(avg(extract(epoch from (o.shipped_at - o.created_at)) / 3600.0))::int
    end
    from orders o
    where o.seller_id = s.id
      and o.payment_status = 'paid'
      and o.shipped_at is not null
      and o.shipped_at >= o.created_at
  ) as ship_hours,
  (
    select case when count(*) >= 2
      then round(avg(secs) / 3600.0)::int
    end
    from (
      select extract(epoch from (
        min(m.created_at) filter (where m.sender = 'seller')
        - min(m.created_at) filter (where m.sender = 'buyer')
      )) as secs
      from dm_threads t
      join dm_messages m on m.thread_id = t.id
      where t.seller_id = s.id
      group by t.id
    ) samples
    where secs is not null and secs >= 0 and secs < 60 * 60 * 24 * 14
  ) as reply_hours,
  (select count(*)::int from items it
    where it.seller_id = s.id and it.status = 'available'
      and (it.drops_at is null or it.drops_at <= now())) as item_count,
  (select count(*)::int from items it
    where it.seller_id = s.id and it.status = 'sold')      as sold_count,
  (select count(*)::int from seller_reviews r where r.seller_id = s.id) as review_count,
  (select avg(r.rating)::float from seller_reviews r where r.seller_id = s.id) as review_avg
`;

const ORDER_COLUMNS = `
  o.*,
  s.handle      as seller_handle,
  s.shop_name   as seller_shop_name,
  s.logo_image_id as seller_logo_image_id,
  s.stripe_account_id as seller_stripe_account_id,
  coalesce(s.stripe_charges_enabled, false) as seller_stripe_charges_enabled,
  coalesce(
    (select json_agg(json_build_object(
       'id', oi.id, 'item_id', oi.item_id, 'title', oi.title,
       'price_cents', oi.price_cents, 'slug', it.slug) order by oi.id)
     from order_items oi left join items it on it.id = oi.item_id
     where oi.order_id = o.id),
    '[]'::json
  ) as lines
`;

export async function getCategories(): Promise<Category[]> {
  return (await sql`
    select * from categories order by sort_order, name
  `) as Category[];
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const rows = (await sql`
    select c.slug, count(i.id)::int as n
    from categories c
    left join items i on i.category_id = c.id and i.status = 'available'
      and (i.drops_at is null or i.drops_at <= now())
    left join sellers s on s.id = i.seller_id
    where i.id is null or s.status = 'active'
    group by c.slug
  `) as { slug: string; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.slug, r.n]));
}

export async function getItemBySlug(slug: string): Promise<Item | null> {
  await releaseDueDrops();
  const rows = (await sql.query(
    `select ${ITEM_COLUMNS}
     ${ITEM_FROM}
     where i.slug = $1`,
    [slug],
  )) as Item[];
  return rows[0] ?? null;
}

export async function getItemById(id: number): Promise<Item | null> {
  const rows = (await sql.query(
    `select ${ITEM_COLUMNS}
     from items i
     left join categories c on c.id = i.category_id
     left join sellers s on s.id = i.seller_id
     where i.id = $1`,
    [id],
  )) as Item[];
  return rows[0] ?? null;
}

export async function getFeaturedItems(limit = 8): Promise<Item[]> {
  return (await sql.query(
    `select ${ITEM_COLUMNS}
     ${ITEM_FROM}
     where i.status = 'available' and (i.drops_at is null or i.drops_at <= now()) and i.featured
     order by (s.official or s.verified_until > now()) desc,
              i.created_at desc
     limit $1`,
    [limit],
  )) as Item[];
}

export async function getLatestItems(limit = 8): Promise<Item[]> {
  await releaseDueDrops();
  return (await sql.query(
    `select ${ITEM_COLUMNS}
     ${ITEM_FROM}
     where i.status = 'available' and (i.drops_at is null or i.drops_at <= now())
     order by (s.official or s.verified_until > now()) desc,
              i.featured desc, i.created_at desc
     limit $1`,
    [limit],
  )) as Item[];
}

/** Pieces a shop scheduled. Hidden from the rack until drops_at. */
export async function upcomingDrops(limit = 8, sellerId?: number): Promise<Item[]> {
  return (await sql.query(
    `select ${ITEM_COLUMNS}
     ${ITEM_FROM}
     where i.status = 'available' and i.drops_at > now()
       and ($2::int is null or i.seller_id = $2::int)
     order by i.drops_at asc
     limit $1`,
    [limit, sellerId ?? null],
  )) as Item[];
}

/** Recent live pieces that published at least one measurement. */
export async function measuredRack(limit = 40): Promise<Item[]> {
  return (await sql.query(
    `select ${ITEM_COLUMNS}
     ${ITEM_FROM}
     where i.status = 'available'
       and (i.drops_at is null or i.drops_at <= now())
       and (i.chest_in is not null or i.waist_in is not null
            or i.inseam_in is not null or i.shoe_size is not null)
     order by i.created_at desc
     limit $1`,
    [limit],
  )) as Item[];
}

/** Items in the same category, excluding the one being viewed. */
export async function getRelatedItems(item: Item, limit = 4): Promise<Item[]> {
  return (await sql.query(
    `select ${ITEM_COLUMNS}
     ${ITEM_FROM}
     where i.status = 'available' and (i.drops_at is null or i.drops_at <= now()) and i.id <> $1
       and ($2::int is null or i.category_id = $2::int)
     order by (s.official or s.verified_until > now()) desc,
              i.featured desc, i.created_at desc
     limit $3`,
    [item.id, item.category_id, limit],
  )) as Item[];
}

export type ShopQuery = {
  category?: string;
  seller?: string;
  q?: string;
  condition?: string;
  size?: string;
  brand?: string;
  maxPrice?: number;
  sort?: string;
  includeSold?: boolean;
  page?: number;
  perPage?: number;
};

const VERIFIED_RANK =
  "(s.official or s.verified_until > now()) desc";

const SORTS: Record<string, string> = {
  newest: `${VERIFIED_RANK}, i.featured desc, i.created_at desc`,
  "price-asc": `i.price_cents asc, ${VERIFIED_RANK}`,
  "price-desc": `i.price_cents desc, ${VERIFIED_RANK}`,
  title: "i.title asc",
};

export async function searchItems(query: ShopQuery) {
  await releaseDueDrops();
  const perPage = query.perPage ?? 12;
  const page = Math.max(1, query.page ?? 1);
  const orderBy = SORTS[query.sort ?? "newest"] ?? SORTS.newest;

  const params: unknown[] = [
    query.category ?? null,
    query.q ? `%${query.q}%` : null,
    query.condition ?? null,
    query.size ?? null,
    query.brand ?? null,
    query.maxPrice ?? null,
    query.seller ?? null,
  ];

  const where = `
    where ($1::text is null or c.slug = $1::text)
      and ($2::text is null or i.title ilike $2::text or i.description ilike $2::text
           or coalesce(i.brand, '') ilike $2::text)
      and ($3::text is null or i.condition = $3::text)
      and ($4::text is null or i.item_size = $4::text)
      and ($5::text is null or i.brand = $5::text)
      and ($6::int is null or i.price_cents <= $6::int)
      and ($7::text is null or s.handle = $7::text)
      and i.status in ${query.includeSold ? "('available','reserved','sold')" : "('available')"}
      and (i.status <> 'available' or i.drops_at is null or i.drops_at <= now())
  `;

  const items = (await sql.query(
    `select ${ITEM_COLUMNS}
     ${ITEM_FROM}
     ${where}
     order by ${orderBy}
     limit $8 offset $9`,
    [...params, perPage, (page - 1) * perPage],
  )) as Item[];

  const countRows = (await sql.query(
    `select count(*)::int as n
     ${ITEM_FROM}
     ${where}`,
    params,
  )) as { n: number }[];

  const total = countRows[0]?.n ?? 0;
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

/** Distinct sizes and brands that are actually in stock, for the filter UI. */
export async function getFilterFacets() {
  const [sizes, brands, price] = await Promise.all([
    sql`select distinct i.item_size from items i
        join sellers s on s.id = i.seller_id and s.status = 'active'
        where i.status = 'available' and (i.drops_at is null or i.drops_at <= now()) and i.item_size is not null
        order by i.item_size`,
    sql`select distinct i.brand from items i
        join sellers s on s.id = i.seller_id and s.status = 'active'
        where i.status = 'available' and (i.drops_at is null or i.drops_at <= now()) and i.brand is not null
        order by i.brand`,
    sql`select coalesce(max(i.price_cents), 0)::int as max from items i
        join sellers s on s.id = i.seller_id and s.status = 'active'
        where i.status = 'available' and (i.drops_at is null or i.drops_at <= now())`,
  ]);
  return {
    sizes: (sizes as { item_size: string }[]).map((r) => r.item_size),
    brands: (brands as { brand: string }[]).map((r) => r.brand),
    maxPrice: (price as { max: number }[])[0]?.max ?? 0,
  };
}

/** Fresh snapshot of the items a visitor has in their cart. */
export async function getItemsByIds(ids: number[]): Promise<Item[]> {
  if (ids.length === 0) return [];
  return (await sql.query(
    `select ${ITEM_COLUMNS}
     ${ITEM_FROM}
     where i.id = any($1::int[])
       and (i.status <> 'available' or i.drops_at is null or i.drops_at <= now())`,
    [ids],
  )) as Item[];
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const rows = (await sql.query(
    `select ${ORDER_COLUMNS}
     from orders o
     left join sellers s on s.id = o.seller_id
     where o.order_number = $1`,
    [orderNumber],
  )) as Order[];
  return rows[0] ?? null;
}

/** Every order placed in one checkout, one per shop. */
export async function getOrderGroup(token: string): Promise<Order[]> {
  return (await sql.query(
    `select ${ORDER_COLUMNS}
     from orders o
     left join sellers s on s.id = o.seller_id
     where o.group_token = $1
     order by o.id`,
    [token],
  )) as Order[];
}

/* ---------- shops ---------- */

export async function getSellerByHandle(handle: string): Promise<SellerCard | null> {
  const rows = (await sql.query(
    `select ${SELLER_CARD_COLUMNS}
     from sellers s
     where s.handle = $1 and s.status = 'active'`,
    [handle],
  )) as SellerCard[];
  return rows[0] ?? null;
}

export async function listSellers(options: { featuredFirst?: boolean; limit?: number } = {}) {
  const limit = options.limit ?? 60;
  return (await sql.query(
    `select ${SELLER_CARD_COLUMNS}
     from sellers s
     where s.status = 'active'
     order by ${options.featuredFirst ? "s.featured desc," : ""}
              (s.official or s.verified_until > now()) desc,
              (select count(*) from items it
                where it.seller_id = s.id and it.status = 'available'
                  and (it.drops_at is null or it.drops_at <= now())) desc,
              s.created_at desc
     limit $1`,
    [limit],
  )) as SellerCard[];
}

/** Shops with at least one live listing, for the homepage rail. */
export async function getStockedSellers(limit = 8) {
  return (await sql.query(
    `select ${SELLER_CARD_COLUMNS}
     from sellers s
     where s.status = 'active'
       and exists (select 1 from items it
                    where it.seller_id = s.id and it.status = 'available'
                      and (it.drops_at is null or it.drops_at <= now()))
     order by s.featured desc,
              (s.official or s.verified_until > now()) desc,
              s.created_at desc
     limit $1`,
    [limit],
  )) as SellerCard[];
}

/** Monday 00:00 UTC of the current ISO week. */
export function utcWeekStart(d = new Date()): Date {
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff),
  );
}

/**
 * Top shops by paid order count in the current calendar week (Mon–Sun UTC).
 * Ranking refreshes as paid orders land; the window resets each Monday.
 */
export async function getWeeklyTopShops(limit = 5): Promise<{
  weekStart: string;
  shops: WeeklyTopShop[];
}> {
  const weekStart = utcWeekStart();
  const shops = (await sql.query(
    `select
       s.id, s.handle, s.shop_name, s.logo_image_id, s.logo_x, s.logo_y,
       count(o.id)::int as sales_count
     from sellers s
     join orders o on o.seller_id = s.id
     where s.status = 'active'
       and o.payment_status = 'paid'
       and o.status <> 'cancelled'
       and o.created_at >= $1::timestamptz
     group by s.id
     order by sales_count desc, max(o.created_at) desc
     limit $2`,
    [weekStart.toISOString(), limit],
  )) as WeeklyTopShop[];
  return { weekStart: weekStart.toISOString(), shops };
}

export async function marketplaceStats() {
  const rows = (await sql`
    select
      (select count(*)::int from sellers where status = 'active')  as shops,
      (select count(*)::int from items i
        join sellers s on s.id = i.seller_id and s.status = 'active'
        where i.status = 'available'
          and (i.drops_at is null or i.drops_at <= now()))            as listings,
      (select count(*)::int from items i
        join sellers s on s.id = i.seller_id and s.status = 'active'
        where i.status = 'sold')                                   as sold
  `) as { shops: number; listings: number; sold: number }[];
  return rows[0];
}

/* ---------- seller dashboard (always scoped by seller_id) ---------- */

export async function sellerItems(sellerId: number, status?: string): Promise<Item[]> {
  return (await sql.query(
    `select ${ITEM_COLUMNS}
     from items i
     left join categories c on c.id = i.category_id
     left join sellers s on s.id = i.seller_id
     where i.seller_id = $1 and ($2::text is null or i.status = $2::text)
     order by i.created_at desc`,
    [sellerId, status ?? null],
  )) as Item[];
}

export async function sellerOrders(sellerId: number): Promise<Order[]> {
  return (await sql.query(
    `select ${ORDER_COLUMNS}
     from orders o
     left join sellers s on s.id = o.seller_id
     where o.seller_id = $1
     order by o.created_at desc
     limit 200`,
    [sellerId],
  )) as Order[];
}

export async function sellerStats(sellerId: number) {
  const rows = (await sql`
    select
      (select count(*)::int from items
        where seller_id = ${sellerId} and status = 'available')     as available,
      (select count(*)::int from items
        where seller_id = ${sellerId} and status = 'sold')          as sold,
      (select count(*)::int from items
        where seller_id = ${sellerId} and status = 'draft')         as drafts,
      (select count(*)::int from orders
        where seller_id = ${sellerId} and status = 'new')           as new_orders,
      (select count(*)::int from orders
        where seller_id = ${sellerId} and payment_status = 'pending') as unpaid,
      (select coalesce(sum(total_cents), 0)::int from orders
        where seller_id = ${sellerId} and payment_status = 'paid')  as earned_cents,
      (select coalesce(sum(price_cents), 0)::int from items
        where seller_id = ${sellerId} and status = 'available')      as stock_value_cents
  `) as {
    available: number;
    sold: number;
    drafts: number;
    shops: number;
    suspended: number;
    new_orders: number;
    unpaid: number;
    earned_cents: number;
    stock_value_cents: number;
  }[];
  return rows[0];
}

/** Extra metrics for Verified sellers on the dashboard. */
export async function sellerInsights(sellerId: number) {
  const rows = (await sql`
    select
      (select coalesce(sum(price_cents), 0)::int from items
        where seller_id = ${sellerId} and status = 'available') as stock_value_cents,
      (select count(*)::int from items
        where seller_id = ${sellerId} and status in ('available', 'auction')) as live_listings,
      (select count(*)::int from items
        where seller_id = ${sellerId} and featured and status = 'available') as spotlights,
      (select count(*)::int from orders
        where seller_id = ${sellerId}
          and payment_status = 'paid'
          and created_at >= now() - interval '7 days') as paid_orders_7d,
      (select coalesce(sum(total_cents), 0)::int from orders
        where seller_id = ${sellerId}
          and payment_status = 'paid'
          and created_at >= now() - interval '7 days') as earned_cents_7d,
      (select count(*)::int from dm_threads
        where seller_id = ${sellerId}
          and updated_at >= now() - interval '7 days') as threads_7d
  `) as {
    stock_value_cents: number;
    live_listings: number;
    spotlights: number;
    paid_orders_7d: number;
    earned_cents_7d: number;
    threads_7d: number;
  }[];
  return rows[0];
}

export async function sellerNotices(sellerId: number) {
  return (await sql`
    select id, kind, body, href, read_at, created_at
    from seller_notices
    where seller_id = ${sellerId}
    order by created_at desc
    limit 30
  `) as {
    id: number;
    kind: string;
    body: string;
    href: string | null;
    read_at: string | null;
    created_at: string;
  }[];
}

/** What the header bell shows a shop: latest notices and what is waiting. */
export async function sellerBell(sellerId: number) {
  const [noticeRows, countRows] = await Promise.all([
    sql`
      select id, kind, body, href, read_at, created_at
      from seller_notices
      where seller_id = ${sellerId}
      order by created_at desc
      limit 6
    `,
    sql`
      select
        (select count(*)::int from seller_notices
          where seller_id = ${sellerId} and read_at is null) as unread,
        (select count(*)::int from dm_threads t
          where t.seller_id = ${sellerId}
            and (select m.sender from dm_messages m
                 where m.thread_id = t.id order by m.id desc limit 1) = 'buyer') as waiting
    `,
  ]);
  const notices = noticeRows as {
    id: number;
    kind: string;
    body: string;
    href: string | null;
    read_at: unknown;
    created_at: unknown;
  }[];
  const counts = countRows as { unread: number; waiting: number }[];
  const iso = (value: unknown) => (value instanceof Date ? value.toISOString() : String(value));
  return {
    notices: notices.map((notice) => ({
      ...notice,
      created_at: iso(notice.created_at),
      read_at: notice.read_at ? iso(notice.read_at) : null,
    })),
    unread: counts[0]?.unread ?? 0,
    waiting: counts[0]?.waiting ?? 0,
  };
}

/** Unread notices plus conversations where the buyer spoke last. */
export async function sellerInboxCount(sellerId: number) {
  const rows = (await sql`
    select
      (select count(*)::int from seller_notices
        where seller_id = ${sellerId} and read_at is null) as notices,
      (select count(*)::int from dm_threads t
        where t.seller_id = ${sellerId}
          and (select m.sender from dm_messages m
               where m.thread_id = t.id order by m.id desc limit 1) = 'buyer') as waiting
  `) as { notices: number; waiting: number }[];
  return (rows[0]?.notices ?? 0) + (rows[0]?.waiting ?? 0);
}

export async function sellerReviews(sellerId: number, limit = 40): Promise<SellerReview[]> {
  return (await sql`
    select id, seller_id, order_id, rating, body, reviewer_name, created_at
    from seller_reviews
    where seller_id = ${sellerId}
    order by created_at desc
    limit ${limit}
  `) as SellerReview[];
}

export async function reviewsForOrders(orderIds: number[]): Promise<SellerReview[]> {
  if (orderIds.length === 0) return [];
  return (await sql.query(
    `select id, seller_id, order_id, rating, body, reviewer_name, created_at
     from seller_reviews
     where order_id = any($1::int[])`,
    [orderIds],
  )) as SellerReview[];
}

export async function sellerMessages(sellerId: number): Promise<Message[]> {
  return (await sql`
    select m.* from messages m
    left join items i on i.id = m.item_id
    where i.seller_id = ${sellerId}
    order by m.handled, m.created_at desc
    limit 100
  `) as Message[];
}

/* ---------- platform admin ---------- */

export async function adminListSellers() {
  return (await sql`
    select s.*,
      (select count(*)::int from items it where it.seller_id = s.id) as item_count,
      (select count(*)::int from orders o  where o.seller_id = s.id) as order_count
    from sellers s
    order by s.created_at desc
  `) as (Seller & { item_count: number; order_count: number })[];
}

/* ---------- admin ---------- */

export async function adminListItems(status?: string): Promise<Item[]> {
  return (await sql.query(
    `select ${ITEM_COLUMNS}
     from items i
     left join categories c on c.id = i.category_id
     left join sellers s on s.id = i.seller_id
     where ($1::text is null or i.status = $1::text)
     order by i.created_at desc`,
    [status ?? null],
  )) as Item[];
}

export async function adminListOrders(): Promise<Order[]> {
  return (await sql.query(
    `select ${ORDER_COLUMNS}
     from orders o
     left join sellers s on s.id = o.seller_id
     order by o.created_at desc
     limit 200`,
    [],
  )) as Order[];
}

const DM_THREAD_COLUMNS = `
  t.id, t.seller_id, t.item_id, t.buyer_name, t.buyer_email, t.created_at, t.updated_at,
  s.shop_name, s.handle,
  i.title as item_title, i.slug as item_slug,
  last.body as last_body, last.sender as last_sender,
  (select count(*)::int from dm_messages m where m.thread_id = t.id) as message_count
`;

const DM_THREAD_FROM = `
  from dm_threads t
  join sellers s on s.id = t.seller_id
  left join items i on i.id = t.item_id
  left join lateral (
    select body, sender from dm_messages
    where thread_id = t.id
    order by created_at desc, id desc
    limit 1
  ) last on true
`;

export async function listBuyerThreads(
  buyerKey: string | null,
  account?: { id: number; email: string } | null,
): Promise<DmThread[]> {
  if (!buyerKey && !account) return [];
  return (await sql.query(
    `select ${DM_THREAD_COLUMNS} ${DM_THREAD_FROM}
     where ($1::text is not null and t.buyer_key = $1)
        or ($2::int is not null and t.buyer_id = $2)
        or ($3::text is not null and lower(t.buyer_email) = lower($3))
     order by t.updated_at desc`,
    [buyerKey, account?.id ?? null, account?.email ?? null],
  )) as DmThread[];
}

export async function listSellerThreads(sellerId: number): Promise<DmThread[]> {
  return (await sql.query(
    `select ${DM_THREAD_COLUMNS} ${DM_THREAD_FROM}
     where t.seller_id = $1
     order by t.updated_at desc`,
    [sellerId],
  )) as DmThread[];
}

export async function listAdminThreads(query?: string): Promise<DmThread[]> {
  const q = query?.trim().toLowerCase() ?? "";
  if (!q) {
    return (await sql.query(
      `select ${DM_THREAD_COLUMNS} ${DM_THREAD_FROM}
       order by t.updated_at desc
       limit 200`,
      [],
    )) as DmThread[];
  }

  const like = `%${q}%`;
  return (await sql.query(
    `select ${DM_THREAD_COLUMNS} ${DM_THREAD_FROM}
     where lower(t.buyer_name) like $1
        or lower(t.buyer_email) like $1
        or lower(s.shop_name) like $1
        or lower(s.handle) like $1
        or lower(coalesce(i.title, '')) like $1
        or cast(t.id as text) = $2
     order by t.updated_at desc
     limit 200`,
    [like, q],
  )) as DmThread[];
}

export async function findBuyerThread(sellerId: number, buyerKey: string): Promise<DmThread | null> {
  const rows = (await sql.query(
    `select ${DM_THREAD_COLUMNS} ${DM_THREAD_FROM}
     where t.seller_id = $1 and t.buyer_key = $2`,
    [sellerId, buyerKey],
  )) as DmThread[];
  return rows[0] ?? null;
}

export async function getBuyerThread(
  id: number,
  buyerKey: string | null,
  account?: { id: number; email: string } | null,
): Promise<DmThread | null> {
  if (!buyerKey && !account) return null;
  const rows = (await sql.query(
    `select ${DM_THREAD_COLUMNS} ${DM_THREAD_FROM}
     where t.id = $1
       and (
         ($2::text is not null and t.buyer_key = $2)
         or ($3::int is not null and t.buyer_id = $3)
         or ($4::text is not null and lower(t.buyer_email) = lower($4))
       )`,
    [id, buyerKey, account?.id ?? null, account?.email ?? null],
  )) as DmThread[];
  return rows[0] ?? null;
}

export type AuctionWin = {
  auction_id: number;
  title: string;
  winner_name: string;
  winner_email: string;
  amount_cents: number;
  settled_at: string | null;
  show_title: string | null;
};

/** Every piece this shop has sold at auction, newest first. */
export async function sellerAuctionWins(sellerId: number): Promise<AuctionWin[]> {
  return (await sql`
    select a.id as auction_id, i.title,
           o.customer_name as winner_name, o.email as winner_email,
           coalesce(
             (select oi.price_cents from order_items oi
              where oi.order_id = o.id order by oi.id limit 1),
             o.subtotal_cents
           ) as amount_cents,
           a.settled_at, sh.title as show_title
    from auctions a
    join orders o on o.id = a.order_id
    join items i on i.id = a.item_id
    left join live_show_lots l on l.auction_id = a.id
    left join live_shows sh on sh.id = l.show_id
    where a.seller_id = ${sellerId} and a.status = 'sold'
    order by a.settled_at desc nulls last, a.id desc
    limit 100
  `) as AuctionWin[];
}

export async function getSellerThread(id: number, sellerId: number): Promise<DmThread | null> {
  const rows = (await sql.query(
    `select ${DM_THREAD_COLUMNS} ${DM_THREAD_FROM}
     where t.id = $1 and t.seller_id = $2`,
    [id, sellerId],
  )) as DmThread[];
  return rows[0] ?? null;
}

export async function getAdminThread(id: number): Promise<DmThread | null> {
  const rows = (await sql.query(
    `select ${DM_THREAD_COLUMNS} ${DM_THREAD_FROM} where t.id = $1`,
    [id],
  )) as DmThread[];
  return rows[0] ?? null;
}

export async function listDmMessages(threadId: number): Promise<DmMessage[]> {
  return (await sql`
    select id, thread_id, sender, body, created_at
    from dm_messages
    where thread_id = ${threadId}
    order by created_at, id
  `) as DmMessage[];
}

export async function adminListMessages(): Promise<Message[]> {
  return (await sql`
    select * from messages order by handled, created_at desc limit 200
  `) as Message[];
}

export async function adminStats() {
  const rows = (await sql`
    select
      (select count(*)::int from items where status = 'available')      as available,
      (select count(*)::int from items where status = 'sold')           as sold,
      (select count(*)::int from items where status = 'draft')          as drafts,
      (select count(*)::int from sellers where status = 'active')        as shops,
      (select count(*)::int from sellers where status = 'suspended')     as suspended,
      (select count(*)::int from orders where status = 'new')           as new_orders,
      (select count(*)::int from messages where not handled)            as open_messages,
      (select count(*)::int from dm_threads t
        where (
          select m.sender from dm_messages m
          where m.thread_id = t.id
          order by m.created_at desc, m.id desc
          limit 1
        ) = 'buyer'
      ) as waiting_dms,
      (select coalesce(sum(total_cents), 0)::int from orders
        where payment_status <> 'refunded')                             as revenue_cents,
      (select coalesce(sum(price_cents), 0)::int from items
        where status = 'available')                                     as stock_value_cents
  `) as {
    available: number;
    sold: number;
    drafts: number;
    shops: number;
    suspended: number;
    new_orders: number;
    open_messages: number;
    waiting_dms: number;
    revenue_cents: number;
    stock_value_cents: number;
  }[];
  return rows[0];
}

export type AdminOrderPayment = {
  id: number;
  order_number: string;
  created_at: string;
  payment_status: string;
  email: string;
  customer_name: string;
  subtotal_cents: number;
  shipping_cents: number;
  platform_fee_cents: number;
  total_cents: number;
  shop_name: string | null;
  handle: string | null;
};

export type AdminPassPayment = {
  id: number;
  created_at: string;
  stripe_session_id: string;
  who: string;
  email: string;
  kind: "seller" | "buyer";
};

export async function adminPaymentSummary() {
  const rows = (await sql`
    select
      coalesce(sum(total_cents) filter (where payment_status = 'paid'), 0)::int as paid_gmv_cents,
      coalesce(sum(platform_fee_cents) filter (where payment_status = 'paid'), 0)::int as platform_fee_cents,
      coalesce(sum(shipping_cents) filter (where payment_status = 'paid'), 0)::int as shipping_cents,
      count(*) filter (where payment_status = 'paid')::int as paid_orders,
      count(*) filter (where payment_status = 'pending')::int as pending_orders,
      (select count(*)::int from verified_payments) as seller_passes,
      (select count(*)::int from buyer_verified_payments) as buyer_passes
    from orders
  `) as {
    paid_gmv_cents: number;
    platform_fee_cents: number;
    shipping_cents: number;
    paid_orders: number;
    pending_orders: number;
    seller_passes: number;
    buyer_passes: number;
  }[];
  return rows[0];
}

export async function adminOrderPayments(): Promise<AdminOrderPayment[]> {
  return (await sql`
    select o.id, o.order_number, o.created_at, o.payment_status, o.email, o.customer_name,
      o.subtotal_cents, o.shipping_cents, o.platform_fee_cents, o.total_cents,
      s.shop_name, s.handle
    from orders o
    left join sellers s on s.id = o.seller_id
    order by o.created_at desc
    limit 150
  `) as AdminOrderPayment[];
}

export async function adminPassPayments(): Promise<AdminPassPayment[]> {
  const sellers = (await sql`
    select p.id, p.created_at, p.stripe_session_id,
      s.shop_name as who, s.email, 'seller' as kind
    from verified_payments p
    join sellers s on s.id = p.seller_id
    order by p.created_at desc
    limit 100
  `) as AdminPassPayment[];
  const buyers = (await sql`
    select p.id, p.created_at, p.stripe_session_id,
      b.name as who, b.email, 'buyer' as kind
    from buyer_verified_payments p
    join buyers b on b.id = p.buyer_id
    order by p.created_at desc
    limit 100
  `) as AdminPassPayment[];
  return [...sellers, ...buyers].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export type HuntReply = {
  id: number;
  hunt_id: number;
  note: string;
  created_at: string;
  shop_name: string;
  handle: string;
  item_title: string | null;
  item_slug: string | null;
  price_cents: number | null;
};

export type Hunt = {
  id: number;
  title: string;
  details: string;
  size_label: string | null;
  budget_cents: number | null;
  created_at: string;
  who: string;
  shop_handle: string | null;
  buyer_id: number | null;
  seller_id: number | null;
  replies: HuntReply[];
};

export async function openHunts(): Promise<Hunt[]> {
  const hunts = (await sql`
    select h.id, h.title, h.details, h.size_label, h.budget_cents, h.created_at,
      h.buyer_id, h.seller_id,
      coalesce(b.name, s.shop_name) as who,
      s.handle as shop_handle
    from hunts h
    left join buyers b on b.id = h.buyer_id
    left join sellers s on s.id = h.seller_id
    where h.status = 'open'
    order by h.created_at desc
    limit 40
  `) as Omit<Hunt, "replies">[];
  if (hunts.length === 0) return [];
  const replies = (await sql.query(
    `select r.id, r.hunt_id, r.note, r.created_at,
            s.shop_name, s.handle,
            i.title as item_title, i.slug as item_slug, i.price_cents
     from hunt_replies r
     join sellers s on s.id = r.seller_id
     left join items i on i.id = r.item_id
     where r.hunt_id = any($1::int[])
     order by r.created_at asc`,
    [hunts.map((hunt) => hunt.id)],
  )) as HuntReply[];
  const byHunt = new Map<number, HuntReply[]>();
  for (const reply of replies) {
    const list = byHunt.get(reply.hunt_id) ?? [];
    list.push(reply);
    byHunt.set(reply.hunt_id, list);
  }
  return hunts.map((hunt) => ({ ...hunt, replies: byHunt.get(hunt.id) ?? [] }));
}

export type ListingOffer = {
  id: number;
  item_id: number;
  amount_cents: number;
  note: string;
  status: string;
  created_at: string;
  from_name: string;
  item_title: string;
  item_slug: string;
  price_cents: number;
};

export async function expireOffers() {
  await sql`
    update offers set status = 'declined'
    where status = 'pending' and created_at < now() - interval '48 hours'
  `;
}

export async function pendingOfferCount(sellerId: number) {
  await expireOffers();
  const rows = (await sql`
    select count(*)::int as n
    from offers o
    join items i on i.id = o.item_id
    where i.seller_id = ${sellerId} and o.status = 'pending' and i.status = 'available'
  `) as { n: number }[];
  return rows[0]?.n ?? 0;
}

export async function pendingOffersForSeller(sellerId: number): Promise<ListingOffer[]> {
  await expireOffers();
  return (await sql`
    select o.id, o.item_id, o.amount_cents, o.note, o.status, o.created_at,
      coalesce(b.name, fs.shop_name) as from_name,
      i.title as item_title, i.slug as item_slug, i.price_cents
    from offers o
    join items i on i.id = o.item_id
    left join buyers b on b.id = o.from_buyer_id
    left join sellers fs on fs.id = o.from_seller_id
    where i.seller_id = ${sellerId} and o.status = 'pending' and i.status = 'available'
    order by o.created_at desc
  `) as ListingOffer[];
}

export async function myOfferOnItem(itemId: number, buyerId: number | null, sellerId: number | null) {
  if (!buyerId && !sellerId) return null;
  await expireOffers();
  const rows = (await sql`
    select id, amount_cents, note, status, created_at
    from offers
    where item_id = ${itemId}
      and (
        (${buyerId}::int is not null and from_buyer_id = ${buyerId})
        or (${sellerId}::int is not null and from_seller_id = ${sellerId})
      )
    order by created_at desc
    limit 1
  `) as { id: number; amount_cents: number; note: string; status: string; created_at: string }[];
  return rows[0] ?? null;
}
