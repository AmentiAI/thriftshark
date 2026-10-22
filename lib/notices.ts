import "server-only";
import { sql } from "@/lib/db";
import { money } from "@/lib/format";

/** One line in the shop's Messages tab. Failures never block the sale itself. */
export async function notifySeller(sellerId: number, kind: string, body: string, href: string | null = null) {
  try {
    await sql`
      insert into seller_notices (seller_id, kind, body, href)
      values (${sellerId}, ${kind}, ${body.slice(0, 400)}, ${href})
    `;
  } catch (err) {
    console.error("notifySeller failed", kind, err);
  }
}

async function orderSummary(orderId: number) {
  const rows = (await sql`
    select o.seller_id, o.customer_name, o.order_number, o.subtotal_cents, o.fulfilment,
           coalesce(string_agg(oi.title, ', ' order by oi.id), '') as titles
    from orders o
    left join order_items oi on oi.order_id = o.id
    where o.id = ${orderId} and o.seller_id is not null
    group by o.id
  `) as {
    seller_id: number;
    customer_name: string;
    order_number: string;
    subtotal_cents: number;
    fulfilment: string;
    titles: string;
  }[];
  return rows[0] ?? null;
}

/** A buyer paid. The shop now ships it (or hands it over). */
export async function noticeOrderPaid(orderId: number) {
  const order = await orderSummary(orderId);
  if (!order) return;
  const what = order.titles || `order ${order.order_number}`;
  const next = order.fulfilment === "ship" ? "Ship it." : "Arrange the hand-off.";
  await notifySeller(
    order.seller_id,
    "sale",
    `Sold: ${what} to ${order.customer_name} for ${money(order.subtotal_cents)}. Paid. ${next}`,
    "/dashboard/orders",
  );
}

/** An auction closed with a winner. Payment comes through checkout after this. */
export async function noticeAuctionWon(orderId: number) {
  const order = await orderSummary(orderId);
  if (!order) return;
  await notifySeller(
    order.seller_id,
    "auction_sold",
    `${order.customer_name} won ${order.titles || "your auction"} for ${money(order.subtotal_cents)}. They still pay through checkout.`,
    "/dashboard/orders",
  );
}
