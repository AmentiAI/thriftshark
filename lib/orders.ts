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
 * Creates the order and marks its items sold in a single statement, so two
 * people checking out with the same one-of-a-kind item cannot both succeed.
 * `for update` makes the loser re-check the row and drop it from `avail`,
 * which fails the `having` guard and inserts nothing at all.
 */
export async function createOrder(itemIds: number[], details: CheckoutDetails) {
  const ids = [...new Set(itemIds)].filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length === 0) {
    return { ok: false as const, error: "Your cart is empty." };
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

  const subtotal = items.reduce((sum, i) => sum + i.price_cents, 0);
  const shipping = shippingFor(subtotal, details.fulfilment);

  const rows = (await sql.query(
    `with avail as (
       select id, title, price_cents
       from items
       where id = any($1::int[]) and status = 'available'
       for update
     ),
     new_order as (
       insert into orders (order_number, email, customer_name, phone,
         address_line1, address_line2, city, region, postal_code, country,
         fulfilment, notes, subtotal_cents, shipping_cents, total_cents)
       select $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
              sum(price_cents)::int,
              $14::int,
              (sum(price_cents) + $14::int)::int
       from avail
       having count(*) = $15::int
       returning id, order_number
     ),
     lines as (
       insert into order_items (order_id, item_id, title, price_cents)
       select (select id from new_order), a.id, a.title, a.price_cents
       from avail a
       where exists (select 1 from new_order)
       returning 1
     ),
     sold as (
       update items set status = 'sold', updated_at = now()
       where id in (select id from avail) and exists (select 1 from new_order)
       returning 1
     )
     select (select order_number from new_order) as order_number,
            (select count(*) from lines)::int    as line_count,
            (select count(*) from sold)::int     as sold_count`,
    [
      ids,
      orderNumber(),
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
      shipping,
      ids.length,
    ],
  )) as { order_number: string | null; line_count: number; sold_count: number }[];

  const result = rows[0];
  if (!result?.order_number) {
    return {
      ok: false as const,
      error: "One of those pieces was claimed while you were checking out. Refresh your bag.",
    };
  }

  return { ok: true as const, orderNumber: result.order_number };
}
