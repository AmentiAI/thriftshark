import { randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { shippingFor } from "@/lib/types";
import { getItemsByIds } from "@/lib/queries";

export type CheckoutDetails = {
  email: string;
  customer_name: string;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  country?: string | null;
  fulfilment: "ship" | "pickup";
  notes?: string | null;
};

function orderNumber() {
  const day = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `TS-${day}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

/**
 * A bag can hold pieces from several shops, and each shop gets paid separately
 * over Cash App — so checkout writes one order per seller, tied together by a
 * group token that the confirmation page looks up.
 *
 * It is still a single statement: `for update` plus the `guard` CTE mean that
 * if any piece is claimed mid-checkout, nothing at all is written and the buyer
 * is told which one went, rather than half the bag going through.
 */
export async function createOrder(itemIds: number[], details: CheckoutDetails) {
  const ids = [...new Set(itemIds)].filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length === 0) {
    return { ok: false as const, error: "Your bag is empty." };
  }

  const items = await getItemsByIds(ids);
  const unavailable = items.filter((i) => i.status !== "available");
  if (items.length !== ids.length || unavailable.length > 0) {
    const names = unavailable.map((i) => i.title).join(", ");
    return {
      ok: false as const,
      error: names
        ? `Just sold: ${names}. Remove it from your bag and try again.`
        : "Something in your bag is no longer listed. Please refresh your bag.",
    };
  }

  const withoutShop = items.filter((i) => !i.seller_id);
  if (withoutShop.length > 0) {
    return {
      ok: false as const,
      error: "One of those listings lost its shop. Remove it and try again.",
    };
  }

  // One order per shop, each with its own shipping threshold.
  const bySeller = new Map<number, typeof items>();
  for (const item of items) {
    const list = bySeller.get(item.seller_id!) ?? [];
    list.push(item);
    bySeller.set(item.seller_id!, list);
  }

  const groupToken = randomBytes(9).toString("base64url");
  const sellerIds: number[] = [];
  const orderNumbers: string[] = [];
  const shippingCents: number[] = [];

  for (const [sellerId, sellerItems] of bySeller) {
    const subtotal = sellerItems.reduce((sum, i) => sum + i.price_cents, 0);
    sellerIds.push(sellerId);
    orderNumbers.push(orderNumber());
    shippingCents.push(shippingFor(subtotal, details.fulfilment));
  }

  const rows = (await sql.query(
    `with avail as (
       select id, title, price_cents, seller_id
       from items
       where id = any($1::int[]) and status = 'available'
       for update
     ),
     guard as (
       select 1 where (select count(*) from avail) = $2::int
     ),
     shops as (
       select * from unnest($3::int[], $4::text[], $5::int[])
                       as t(seller_id, order_number, shipping_cents)
     ),
     new_orders as (
       insert into orders (order_number, seller_id, group_token, email, customer_name,
         phone, address_line1, address_line2, city, region, postal_code, country,
         fulfilment, notes, subtotal_cents, shipping_cents, total_cents)
       select h.order_number, h.seller_id, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
              $16, $17,
              sum(a.price_cents)::int,
              h.shipping_cents,
              (sum(a.price_cents) + h.shipping_cents)::int
       from shops h
       join avail a on a.seller_id = h.seller_id
       where exists (select 1 from guard)
       group by h.seller_id, h.order_number, h.shipping_cents
       returning id, seller_id
     ),
     lines as (
       insert into order_items (order_id, item_id, title, price_cents)
       select o.id, a.id, a.title, a.price_cents
       from avail a
       join new_orders o on o.seller_id = a.seller_id
       returning 1
     ),
     sold as (
       update items set status = 'sold', updated_at = now()
       where id in (select id from avail) and exists (select 1 from guard)
       returning 1
     )
     select (select count(*) from new_orders)::int as order_count,
            (select count(*) from lines)::int      as line_count,
            (select count(*) from sold)::int       as sold_count`,
    [
      ids,
      ids.length,
      sellerIds,
      orderNumbers,
      shippingCents,
      groupToken,
      details.email,
      details.customer_name,
      details.phone ?? null,
      details.address_line1 ?? null,
      details.address_line2 ?? null,
      details.city ?? null,
      details.region ?? null,
      details.postal_code ?? null,
      details.country ?? "US",
      details.fulfilment,
      details.notes ?? null,
    ],
  )) as { order_count: number; line_count: number; sold_count: number }[];

  const result = rows[0];
  if (!result || result.order_count === 0 || result.line_count !== ids.length) {
    return {
      ok: false as const,
      error: "One of those pieces was claimed while you were checking out. Refresh your bag.",
    };
  }

  return { ok: true as const, groupToken, orderCount: result.order_count };
}
