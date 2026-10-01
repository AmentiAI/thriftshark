import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { setOrderStatus } from "@/lib/actions";
import { money, shortDate } from "@/lib/format";
import { adminListOrders } from "@/lib/queries";

export const dynamic = "force-dynamic";

const ORDER_STATUSES = ["new", "packed", "shipped", "picked-up", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "refunded"];

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await adminListOrders();

  return (
    <div>
      <header className="mb-6">
        <h2 className="font-display text-2xl font-bold tracking-tight">Orders</h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          {orders.length} {orders.length === 1 ? "order" : "orders"}. Items are
          already marked sold when an order lands.
        </p>
      </header>

      {orders.length === 0 ? (
        <p className="border border-line bg-paper-dim/40 px-5 py-16 text-center text-sm text-ink-soft">
          No orders yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="border border-line p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-semibold">{order.order_number}</p>
                  <p className="mt-1 text-sm">
                    {order.customer_name} ·{" "}
                    <a href={`mailto:${order.email}`} className="underline hover:text-reef-dark">
                      {order.email}
                    </a>
                    {order.phone && ` · ${order.phone}`}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {shortDate(order.created_at)} ·{" "}
                    {order.fulfilment === "pickup" ? "Store pickup" : "Ship"}
                  </p>
                </div>
                <p className="font-display text-xl font-bold">{money(order.total_cents)}</p>
              </div>

              <ul className="mt-4 divide-y divide-line/60 border-y border-line/60 text-sm">
                {order.lines.map((line) => (
                  <li key={line.id} className="flex justify-between gap-4 py-2">
                    {line.slug ? (
                      <Link href={`/item/${line.slug}`} className="hover:text-reef-dark">
                        {line.title}
                      </Link>
                    ) : (
                      <span>{line.title}</span>
                    )}
                    <span className="shrink-0">{money(line.price_cents)}</span>
                  </li>
                ))}
              </ul>

              {order.fulfilment === "ship" && (
                <address className="mt-4 text-xs leading-relaxed text-ink-soft not-italic">
                  {[
                    order.address_line1,
                    order.address_line2,
                    [order.city, order.region].filter(Boolean).join(", "),
                    order.postal_code,
                    order.country,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </address>
              )}

              {order.notes && (
                <p className="mt-4 border-l-4 border-reef bg-reef/10 px-3 py-2 text-sm">
                  <strong>Note:</strong> {order.notes}
                </p>
              )}

              <form action={setOrderStatus} className="mt-5 flex flex-wrap items-end gap-3">
                <input type="hidden" name="id" value={order.id} />
                <div>
                  <label
                    htmlFor={`status-${order.id}`}
                    className="mb-1 block text-xs font-semibold tracking-wide text-ink-faint uppercase"
                  >
                    Fulfilment
                  </label>
                  <select
                    id={`status-${order.id}`}
                    name="status"
                    defaultValue={order.status}
                    className="border border-line bg-paper px-3 py-2 text-sm capitalize"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor={`payment-${order.id}`}
                    className="mb-1 block text-xs font-semibold tracking-wide text-ink-faint uppercase"
                  >
                    Payment
                  </label>
                  <select
                    id={`payment-${order.id}`}
                    name="payment_status"
                    defaultValue={order.payment_status}
                    className="border border-line bg-paper px-3 py-2 text-sm capitalize"
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="border border-ink px-4 py-2 text-sm font-semibold tracking-wide uppercase hover:bg-ink hover:text-paper">
                  Update
                </button>
                <a
                  href={`mailto:${order.email}?subject=Your%20Thrift%20Shark%20order%20${order.order_number}`}
                  className="ml-auto text-sm underline hover:text-reef-dark"
                >
                  Email customer
                </a>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
