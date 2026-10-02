import Link from "next/link";
import { money, shortDate } from "@/lib/format";
import { adminListMessages, adminListOrders, adminStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, orders, messages] = await Promise.all([
    adminStats(),
    adminListOrders(),
    adminListMessages(),
  ]);

  const tiles = [
    ["Shops", String(stats.shops), "/admin/sellers"],
    ["In stock", String(stats.available), "/admin/items"],
    ["Sold", String(stats.sold), "/admin/items?status=sold"],
    ["Drafts", String(stats.drafts), "/admin/items?status=draft"],
    ["Orders to pack", String(stats.new_orders), "/admin/orders"],
    ["Stock value", money(stats.stock_value_cents), "/admin/items"],
    ["Order revenue", money(stats.revenue_cents), "/admin/orders"],
  ];

  const recentOrders = orders.slice(0, 6);
  const openMessages = messages.filter((m) => !m.handled).slice(0, 5);

  return (
    <div className="space-y-12">
      <section>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tiles.map(([label, value, href]) => (
            <Link
              key={label}
              href={href}
              className="border border-line bg-paper-dim/40 p-4 transition hover:border-ink"
            >
              <p className="eyebrow text-ink-faint">{label}</p>
              <p className="mt-2 font-display text-2xl font-bold">{value}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Latest orders</h2>
          <Link href="/admin/orders" className="text-sm underline hover:text-reef-dark">
            All orders
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="mt-4 border border-line bg-paper-dim/40 px-5 py-10 text-center text-sm text-ink-soft">
            No orders yet. They will show up here the moment one lands.
          </p>
        ) : (
          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {["Order", "Customer", "Pieces", "Total", "Status", "Placed"].map((h) => (
                  <th key={h} className="eyebrow py-2.5 text-ink-faint">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-line/60">
                  <td className="py-3 font-mono text-xs">
                    <Link href="/admin/orders" className="underline hover:text-reef-dark">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="py-3">{order.customer_name}</td>
                  <td className="py-3">{order.lines.length}</td>
                  <td className="py-3 font-semibold">{money(order.total_cents)}</td>
                  <td className="py-3">
                    <span className="border border-line px-2 py-0.5 text-xs capitalize">
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-ink-faint">{shortDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">
            Unanswered messages{" "}
            {stats.open_messages > 0 && (
              <span className="ml-1 bg-coral px-2 py-0.5 align-middle text-xs text-white">
                {stats.open_messages}
              </span>
            )}
          </h2>
          <Link href="/admin/messages" className="text-sm underline hover:text-reef-dark">
            All messages
          </Link>
        </div>

        {openMessages.length === 0 ? (
          <p className="mt-4 border border-line bg-paper-dim/40 px-5 py-10 text-center text-sm text-ink-soft">
            Inbox clear.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {openMessages.map((m) => (
              <li key={m.id} className="py-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-medium">
                    {m.name} <span className="text-ink-faint">· {m.email}</span>
                  </p>
                  <p className="text-xs text-ink-faint">{shortDate(m.created_at)}</p>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border border-line bg-paper-dim/40 p-6">
        <h2 className="font-display text-lg font-bold">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/admin/sellers" className="bg-ink px-5 py-3 text-sm font-semibold tracking-wide text-paper uppercase">
            Manage shops
          </Link>
          <Link href="/admin/items?status=draft" className="border border-ink px-5 py-3 text-sm font-semibold tracking-wide uppercase">
            Finish drafts
          </Link>
          <Link href="/admin/orders" className="border border-ink px-5 py-3 text-sm font-semibold tracking-wide uppercase">
            Pack orders
          </Link>
        </div>
      </section>
    </div>
  );
}
