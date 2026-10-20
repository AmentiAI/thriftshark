import Link from "next/link";
import { money, shortDate } from "@/lib/format";
import { requireAdmin } from "@/lib/auth";
import { adminOrderPayments, adminPassPayments, adminPaymentSummary } from "@/lib/queries";
import { BUYER_VERIFIED_PRICE_USD } from "@/lib/buyer-account";
import { SELLER_PLAN_PRICE_USD } from "@/lib/seller-plan";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const [summary, orders, passes] = await Promise.all([
    adminPaymentSummary(),
    adminOrderPayments(),
    adminPassPayments(),
  ]);

  const sellerPassCents = summary.seller_passes * SELLER_PLAN_PRICE_USD * 100;
  const buyerPassCents = summary.buyer_passes * BUYER_VERIFIED_PRICE_USD * 100;

  const tiles = [
    ["Paid orders", String(summary.paid_orders)],
    ["Waiting on card", String(summary.pending_orders)],
    ["Order total", money(summary.paid_gmv_cents)],
    ["Platform fees", money(summary.platform_fee_cents)],
    ["Shipping to shops", money(summary.shipping_cents)],
    ["Verified passes", money(sellerPassCents + buyerPassCents)],
  ];

  return (
    <div className="space-y-12">
      <header>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Payments</h2>
        <p className="mt-1.5 max-w-xl text-sm text-ink-soft">
          Card orders, the platform fee, shipping that settles to the shop, and
          Verified passes. Item price and shipping go to the seller. The fee and
          the passes stay with Thrift Sharks.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map(([label, value]) => (
          <div key={label} className="border border-line bg-paper-dim/40 p-4">
            <p className="eyebrow text-ink-faint">{label}</p>
            <p className="mt-2 font-display text-2xl font-bold">{value}</p>
          </div>
        ))}
      </section>

      <section>
        <h3 className="font-display text-lg font-extrabold tracking-tight">Orders</h3>
        {orders.length === 0 ? (
          <p className="mt-4 border border-line bg-paper-dim/40 px-5 py-10 text-center text-sm text-ink-soft">
            No orders yet.
          </p>
        ) : (
          <div className="scroll-x mt-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  {["Order", "Shop", "Buyer", "Items", "Ship", "Fee", "Total", "Card", "When"].map(
                    (h) => (
                      <th key={h} className="eyebrow py-2.5 pr-3 text-ink-faint">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-line/60">
                    <td className="py-3 pr-3 font-mono text-xs">
                      <Link href="/admin/orders" className="underline">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="py-3 pr-3">
                      {order.handle ? (
                        <Link href={`/shop/${order.handle}`} className="underline">
                          {order.shop_name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <p>{order.customer_name}</p>
                      <p className="break-anywhere text-xs text-ink-faint">{order.email}</p>
                    </td>
                    <td className="py-3 pr-3">{money(order.subtotal_cents)}</td>
                    <td className="py-3 pr-3">{money(order.shipping_cents)}</td>
                    <td className="py-3 pr-3">{money(order.platform_fee_cents)}</td>
                    <td className="py-3 pr-3 font-semibold">{money(order.total_cents)}</td>
                    <td className="py-3 pr-3 capitalize">{order.payment_status}</td>
                    <td className="py-3 whitespace-nowrap text-ink-faint">
                      {shortDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="font-display text-lg font-extrabold tracking-tight">Verified passes</h3>
        <p className="mt-1 text-sm text-ink-soft">
          Sellers ${SELLER_PLAN_PRICE_USD} / 30 days · buyers ${BUYER_VERIFIED_PRICE_USD} / 30 days.
        </p>
        {passes.length === 0 ? (
          <p className="mt-4 border border-line bg-paper-dim/40 px-5 py-10 text-center text-sm text-ink-soft">
            No Verified payments yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {passes.map((pass) => (
              <li
                key={`${pass.kind}-${pass.id}`}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{pass.who}</p>
                  <p className="break-anywhere text-xs text-ink-faint">
                    {pass.kind === "seller" ? "Seller" : "Buyer"} · {pass.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {money(
                      (pass.kind === "seller" ? SELLER_PLAN_PRICE_USD : BUYER_VERIFIED_PRICE_USD) *
                        100,
                    )}
                  </p>
                  <p className="text-xs text-ink-faint">{shortDate(pass.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}