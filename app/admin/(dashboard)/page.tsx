import Link from "next/link";
import { money, shortDate, shortWhen } from "@/lib/format";
import { ACTIVITY_LABELS, adminActivity, adminPulse } from "@/lib/admin-activity";
import { adminListOrders, adminStats, listAdminThreads } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, pulse, activity, orders, threads] = await Promise.all([
    adminStats(),
    adminPulse(),
    adminActivity(null, 12),
    adminListOrders(),
    listAdminThreads(),
  ]);

  const tiles = [
    ["Shops", String(stats.shops), "/admin/sellers"],
    ["New shops (7d)", String(pulse.shops_7d), "/admin/activity?type=shop"],
    ["Shoppers", String(pulse.buyers), "/admin/activity?type=buyer"],
    ["New shoppers (7d)", String(pulse.buyers_7d), "/admin/activity?type=buyer"],
    ["Shops not ID-checked", String(pulse.unchecked_shops), "/admin/sellers"],
    ["Live now", String(pulse.live_now), "/admin/activity?type=live"],
    ["Open auctions", String(pulse.open_auctions), "/admin/activity?type=auction"],
    ["Bids (24h)", String(pulse.bids_24h), "/admin/activity?type=bid"],
    ["Pending offers", String(pulse.pending_offers), "/admin/activity?type=offer"],
    ["Open hunts", String(pulse.open_hunts), "/admin/activity?type=hunt"],
    ["In stock", String(stats.available), "/admin/items"],
    ["Sold", String(stats.sold), "/admin/items?status=sold"],
    ["Drafts", String(stats.drafts), "/admin/items?status=draft"],
    ["Orders to pack", String(stats.new_orders), "/admin/orders"],
    ["Unpaid orders", String(pulse.unpaid_orders), "/admin/payments"],
    ["Paid (7d)", `${pulse.paid_7d} · ${money(pulse.paid_7d_cents)}`, "/admin/activity?type=payment"],
    ["Waiting DMs", String(stats.waiting_dms), "/admin/messages"],
    ["Stock value", money(stats.stock_value_cents), "/admin/items"],
    ["Order revenue", money(stats.revenue_cents), "/admin/orders"],
  ];

  const recentOrders = orders.slice(0, 6);
  const waiting = threads.filter((thread) => thread.last_sender === "buyer").slice(0, 5);

  return (
    <div className="space-y-12">
      <section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tiles.map(([label, value, href]) => (
            <Link
              key={label}
              href={href}
              className="border border-line bg-paper-dim/40 p-4 transition hover:border-ink"
            >
              <p className="eyebrow text-ink-faint">{label}</p>
              <p className="mt-2 font-display text-2xl font-bold break-anywhere">{value}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Latest activity</h2>
          <Link href="/admin/activity" className="text-sm underline hover:text-reef-dark">
            Everything
          </Link>
        </div>
        {activity.length === 0 ? (
          <p className="mt-4 border border-line bg-paper-dim/40 px-5 py-10 text-center text-sm text-ink-soft">
            Nothing has happened yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {activity.map((row, i) => (
              <li key={`${row.kind}-${row.at}-${i}`} className="flex items-start gap-3 py-3 text-sm">
                <span className="mt-0.5 w-20 shrink-0 text-[11px] font-bold tracking-wider text-ink-faint uppercase">
                  {ACTIVITY_LABELS[row.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium break-anywhere">{row.title}</p>
                  {row.detail && <p className="text-ink-soft break-anywhere">{row.detail}</p>}
                </div>
                <span className="shrink-0 text-xs text-ink-faint">{shortWhen(row.at)}</span>
              </li>
            ))}
          </ul>
        )}
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
          <div className="scroll-x mt-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
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
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">
            Unanswered messages{" "}
            {waiting.length > 0 && (
              <span className="ml-1 bg-coral px-2 py-0.5 align-middle text-xs text-white">
                {waiting.length}
              </span>
            )}
          </h2>
          <Link href="/admin/messages" className="text-sm underline hover:text-reef-dark">
            All messages
          </Link>
        </div>

        {waiting.length === 0 ? (
          <p className="mt-4 border border-line bg-paper-dim/40 px-5 py-10 text-center text-sm text-ink-soft">
            Inbox clear.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {waiting.map((thread) => (
              <li key={thread.id} className="py-3">
                <Link href={`/admin/messages/${thread.id}`} className="block">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-medium">
                      {thread.buyer_name}{" "}
                      <span className="text-ink-faint">→ {thread.shop_name}</span>
                    </p>
                    <p className="text-xs text-ink-faint">{shortDate(thread.updated_at)}</p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{thread.last_body}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border border-line bg-paper-dim/40 p-6">
        <h2 className="font-display text-lg font-bold">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/admin/sellers" className="bg-void px-5 py-3 text-sm font-semibold tracking-wide text-ink uppercase">
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
