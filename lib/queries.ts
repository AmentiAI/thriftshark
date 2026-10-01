import { sql } from "@/lib/db";
import type { Category, Item, Message, Order } from "@/lib/types";

const ITEM_COLUMNS = `
  i.id, i.slug, i.title, i.description, i.price_cents, i.compare_at_cents,
  i.category_id, i.brand, i.item_size, i.condition, i.color, i.status,
  i.featured, i.created_at,
  c.name as category_name, c.slug as category_slug,
  coalesce(
    (select json_agg(json_build_object('url', im.url, 'alt', im.alt) order by im.position, im.id)
     from item_images im where im.item_id = i.id),
    '[]'::json
  ) as images
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
    group by c.slug
  `) as { slug: string; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.slug, r.n]));
}

export async function getItemBySlug(slug: string): Promise<Item | null> {
  const rows = (await sql.query(
    `select ${ITEM_COLUMNS}
     from items i left join categories c on c.id = i.category_id
     where i.slug = $1`,
    [slug],
  )) as Item[];
  return rows[0] ?? null;
}

export async function getItemById(id: number): Promise<Item | null> {
  const rows = (await sql.query(
    `select ${ITEM_COLUMNS}
     from items i left join categories c on c.id = i.category_id
     where i.id = $1`,
    [id],
  )) as Item[];
  return rows[0] ?? null;
}

export async function getFeaturedItems(limit = 8): Promise<Item[]> {
  return (await sql.query(
    `select ${ITEM_COLUMNS}
     from items i left join categories c on c.id = i.category_id
     where i.status = 'available' and i.featured
     order by i.created_at desc
     limit $1`,
    [limit],
  )) as Item[];
}

export async function getLatestItems(limit = 8): Promise<Item[]> {
  return (await sql.query(
    `select ${ITEM_COLUMNS}
     from items i left join categories c on c.id = i.category_id
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
     from items i left join categories c on c.id = i.category_id
     where i.status = 'available' and i.id <> $1
       and ($2::int is null or i.category_id = $2::int)
     order by i.featured desc, i.created_at desc
     limit $3`,
    [item.id, item.category_id, limit],
  )) as Item[];
}

export type ShopQuery = {
  category?: string;
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
  ];

  const where = `
    where ($1::text is null or c.slug = $1::text)
      and ($2::text is null or i.title ilike $2::text or i.description ilike $2::text
           or coalesce(i.brand, '') ilike $2::text)
      and ($3::text is null or i.condition = $3::text)
      and ($4::text is null or i.item_size = $4::text)
      and ($5::text is null or i.brand = $5::text)
      and ($6::int is null or i.price_cents <= $6::int)
      and i.status in ${query.includeSold ? "('available','reserved','sold')" : "('available')"}
  `;

  const items = (await sql.query(
    `select ${ITEM_COLUMNS}
     from items i left join categories c on c.id = i.category_id
     ${where}
     order by ${orderBy}
     limit $7 offset $8`,
    [...params, perPage, (page - 1) * perPage],
  )) as Item[];

  const countRows = (await sql.query(
    `select count(*)::int as n
     from items i left join categories c on c.id = i.category_id
     ${where}`,
    params,
  )) as { n: number }[];

  const total = countRows[0]?.n ?? 0;
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

/** Distinct sizes and brands that are actually in stock, for the filter UI. */
export async function getFilterFacets() {
  const [sizes, brands, price] = await Promise.all([
    sql`select distinct item_size from items
        where status = 'available' and item_size is not null order by item_size`,
    sql`select distinct brand from items
        where status = 'available' and brand is not null order by brand`,
    sql`select coalesce(max(price_cents), 0)::int as max from items where status = 'available'`,
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
     from items i left join categories c on c.id = i.category_id
     where i.id = any($1::int[])`,
    [ids],
  )) as Item[];
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const rows = (await sql`
    select o.*,
      coalesce(
        (select json_agg(json_build_object(
           'id', oi.id, 'item_id', oi.item_id, 'title', oi.title,
           'price_cents', oi.price_cents, 'slug', it.slug) order by oi.id)
         from order_items oi left join items it on it.id = oi.item_id
         where oi.order_id = o.id),
        '[]'::json
      ) as lines
    from orders o
    where o.order_number = ${orderNumber}
  `) as Order[];
  return rows[0] ?? null;
}

/* ---------- admin ---------- */

export async function adminListItems(status?: string): Promise<Item[]> {
  return (await sql.query(
    `select ${ITEM_COLUMNS}
     from items i left join categories c on c.id = i.category_id
     where ($1::text is null or i.status = $1::text)
     order by i.created_at desc`,
    [status ?? null],
  )) as Item[];
}

export async function adminListOrders(): Promise<Order[]> {
  return (await sql`
    select o.*,
      coalesce(
        (select json_agg(json_build_object(
           'id', oi.id, 'item_id', oi.item_id, 'title', oi.title,
           'price_cents', oi.price_cents, 'slug', it.slug) order by oi.id)
         from order_items oi left join items it on it.id = oi.item_id
         where oi.order_id = o.id),
        '[]'::json
      ) as lines
    from orders o
    order by o.created_at desc
    limit 200
  `) as Order[];
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
    new_orders: number;
    open_messages: number;
    revenue_cents: number;
    stock_value_cents: number;
  }[];
  return rows[0];
}
