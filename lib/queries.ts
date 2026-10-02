import { sql } from "@/lib/db";
import type { Category, Item, Message, Order, Seller, SellerCard } from "@/lib/types";

const ITEM_COLUMNS = `
  i.id, i.slug, i.title, i.description, i.price_cents, i.compare_at_cents,
  i.category_id, i.brand, i.item_size, i.condition, i.color, i.status,
  i.featured, i.created_at, i.seller_id,
  c.name as category_name, c.slug as category_slug,
  s.handle as seller_handle, s.shop_name as seller_shop_name,
  s.logo_image_id as seller_logo_image_id, s.cashapp_tag as seller_cashapp_tag,
  coalesce(
    (select json_agg(json_build_object('url', im.url, 'image_id', im.image_id, 'alt', im.alt)
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
  s.id, s.handle, s.shop_name, s.tagline, s.bio, s.location, s.cashapp_tag,
  s.logo_image_id, s.banner_image_id, s.qr_image_id, s.featured, s.created_at,
  (select count(*)::int from items it
    where it.seller_id = s.id and it.status = 'available') as item_count,
  (select count(*)::int from items it
    where it.seller_id = s.id and it.status = 'sold')      as sold_count
`;

const ORDER_COLUMNS = `
  o.*,
  s.handle      as seller_handle,
  s.shop_name   as seller_shop_name,
  s.cashapp_tag as seller_cashapp_tag,
  s.qr_image_id as seller_qr_image_id,
  s.logo_image_id as seller_logo_image_id,
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
    left join sellers s on s.id = i.seller_id
    where i.id is null or s.status = 'active'
    group by c.slug
  `) as { slug: string; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.slug, r.n]));
}

export async function getItemBySlug(slug: string): Promise<Item | null> {
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
     where i.status = 'available' and i.featured
     order by i.created_at desc
     limit $1`,
    [limit],
  )) as Item[];
}

export async function getLatestItems(limit = 8): Promise<Item[]> {
  return (await sql.query(
    `select ${ITEM_COLUMNS}
     ${ITEM_FROM}
     where i.status = 'available'
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
     where i.status = 'available' and i.id <> $1
       and ($2::int is null or i.category_id = $2::int)
     order by i.featured desc, i.created_at desc
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

const SORTS: Record<string, string> = {
  newest: "i.created_at desc",
  "price-asc": "i.price_cents asc",
  "price-desc": "i.price_cents desc",
  title: "i.title asc",
};

export async function searchItems(query: ShopQuery) {
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
        where i.status = 'available' and i.item_size is not null
        order by i.item_size`,
    sql`select distinct i.brand from items i
        join sellers s on s.id = i.seller_id and s.status = 'active'
        where i.status = 'available' and i.brand is not null
        order by i.brand`,
    sql`select coalesce(max(i.price_cents), 0)::int as max from items i
        join sellers s on s.id = i.seller_id and s.status = 'active'
        where i.status = 'available'`,
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
     where i.id = any($1::int[])`,
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
              (select count(*) from items it
                where it.seller_id = s.id and it.status = 'available') desc,
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
                    where it.seller_id = s.id and it.status = 'available')
     order by s.featured desc, s.created_at desc
     limit $1`,
    [limit],
  )) as SellerCard[];
}

export async function marketplaceStats() {
  const rows = (await sql`
    select
      (select count(*)::int from sellers where status = 'active')  as shops,
      (select count(*)::int from items i
        join sellers s on s.id = i.seller_id and s.status = 'active'
        where i.status = 'available')                              as listings,
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
    revenue_cents: number;
    stock_value_cents: number;
  }[];
  return rows[0];
}
