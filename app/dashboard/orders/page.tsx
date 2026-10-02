import Link from "next/link";
import { setSellerOrderStatus } from "@/lib/actions";
import { money, shortDate } from "@/lib/format";
import { requireSeller } from "@/lib/seller-auth";
import { sellerOrders } from "@/lib/queries";

export const dynamic = "force-dynamic";

const ORDER_STATUSES = ["new", "packed", "shipped", "picked-up", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "refunded"];

export default async function DashboardOrdersPage() {
  const seller = await requireSeller();
  const orders = await sellerOrders(seller.id);
  const unpaid = orders.filter((o) => o.payment_status === "pending").length;

  return (
    <div>
      <header className="mb-7">
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em]">
          Your orders
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          {orders.length} {orders.length === 1 ? "order" : "orders"} · {unpaid} waiting
          on a Cash App payment. Mark an order paid once the money lands, then
          ship it.
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="panel px-6 py-20 text-center">
          <h3 className="font-display text-2xl font-extrabold tracking-tight">
            No orders yet
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
            When someone buys from your shop it shows up here with their
            address and what they owe you.
          </p>
          <Link href="/dashboard/items/new" className="btn btn-lime mt-6">
            Add another listing
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="panel break-anywhere p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-bold">{order.order_number}</p>
                  <p className="mt-1 text-sm">
                    {order.customer_name} ·{" "}
                    <a
                      href={`mailto:${order.email}`}
                      className="underline hover:text-reef-dark"
                    >
                      {order.email}
                    </a>
                    {order.phone && ` · ${order.phone}`}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {shortDate(order.created_at)} ·{" "}
                    {order.fulfilment === "pickup" ? "Collecting in person" : "Needs shipping"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-extrabold">
                    {money(order.total_cents)}
                  </p>
                  <p
                    className={`text-xs font-bold uppercase ${
                      order.payment_status === "paid" ? "text-kelp" : "text-coral"
                    }`}
                  >
                    {order.payment_status === "paid" ? "Paid" : "Awaiting payment"}
                  </p>
                </div>
              </div>

              <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
                {order.lines.map((line) => (
                  <li key={line.id} className="flex justify-between gap-4 py-2.5">
                    {line.slug ? (
                      <Link href={`/item/${line.slug}`} className="hover:text-reef-dark">
                        {line.title}
                      </Link>
                    ) : (
                      <span>{line.title}</span>
                    )}
                    <span className="shrink-0 font-semibold">{money(line.price_cents)}</span>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                <div>
                  <dt className="font-bold tracking-wide text-ink-faint uppercase">Subtotal</dt>
                  <dd className="mt-0.5">{money(order.subtotal_cents)}</dd>
                </div>
                <div>
                  <dt className="font-bold tracking-wide text-ink-faint uppercase">Shipping</dt>
                  <dd className="mt-0.5">
                    {order.shipping_cents === 0 ? "Free" : money(order.shipping_cents)}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold tracking-wide text-ink-faint uppercase">
                    They should send
                  </dt>
                  <dd className="mt-0.5 font-bold">{money(order.total_cents)}</dd>
                </div>
              </dl>

              {order.fulfilment === "ship" && (
                <address className="mt-4 rounded-2xl bg-paper-dim px-4 py-3 text-xs leading-relaxed not-italic text-ink-soft">
                  <strong className="text-ink">Ship to:</strong> {order.customer_name},{" "}
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
                <p className="mt-3 rounded-2xl border-l-4 border-reef bg-reef/10 px-4 py-3 text-sm">
                  <strong>Buyer note:</strong> {order.notes}
                </p>
              )}

              <form action={setSellerOrderStatus} className="mt-5 flex flex-wrap items-end gap-3">
                <input type="hidden" name="id" value={order.id} />
                <div>
                  <label
                    htmlFor={`status-${order.id}`}
                    className="mb-1 block text-xs font-bold tracking-wide text-ink-faint uppercase"
                  >
                    Fulfilment
                  </label>
                  <select
                    id={`status-${order.id}`}
                    name="status"
                    defaultValue={order.status}
                    className="field !w-auto capitalize"
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
                    className="mb-1 block text-xs font-bold tracking-wide text-ink-faint uppercase"
                  >
                    Payment
                  </label>
                  <select
                    id={`payment-${order.id}`}
                    name="payment_status"
                    defaultValue={order.payment_status}
                    className="field !w-auto capitalize"
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-ink">Update</button>
                <a
                  href={`mailto:${order.email}?subject=Your%20${encodeURIComponent(seller.shop_name)}%20order%20${order.order_number}`}
                  className="ml-auto text-sm underline hover:text-reef-dark"
                >
                  Email buyer
                </a>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
