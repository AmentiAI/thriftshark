import Link from "next/link";
import { money, shortDate } from "@/lib/format";
import { requireSeller } from "@/lib/seller-auth";
import { sellerInsights, sellerOrders, sellerStats } from "@/lib/queries";
import { isSellerVerified, SELLER_PLAN_PRICE_USD } from "@/lib/seller-plan";

export const dynamic = "force-dynamic";

export default async function DashboardHome(props: PageProps<"/dashboard">) {
  const seller = await requireSeller();
  const params = await props.searchParams;
  const welcome = (Array.isArray(params.welcome) ? params.welcome[0] : params.welcome) === "1";
  const verified = isSellerVerified(seller);

  const [stats, orders, insights] = await Promise.all([
    sellerStats(seller.id),
    sellerOrders(seller.id),
    verified ? sellerInsights(seller.id) : Promise.resolve(null),
  ]);

  const tiles = [
    ["Live listings", String(stats.available), "/dashboard/items"],
    ["Sold", String(stats.sold), "/dashboard/items?status=sold"],
    ["Drafts", String(stats.drafts), "/dashboard/items?status=draft"],
    ["Orders to send", String(stats.new_orders), "/dashboard/orders"],
    ["Awaiting payment", String(stats.unpaid), "/dashboard/orders"],
    ["Paid to you", money(stats.earned_cents), "/dashboard/orders"],
  ];

  const recent = orders.slice(0, 5);
  const payoutReady = Boolean(seller.stripe_charges_enabled);
  const setupNeeded = [
    !payoutReady && ["Connect Stripe payouts", "/dashboard/shop"],
    !seller.logo_image_id && ["Add your logo", "/dashboard/shop"],
    !seller.bio && ["Write a shop bio", "/dashboard/shop"],
    stats.available === 0 && ["List your first piece", "/dashboard/items/new"],
  ].filter(Boolean) as [string, string][];

  return (
    <div className="space-y-12">
      {welcome && (
        <section className="rounded-[2rem] bg-void p-8 text-white sm:p-10">
          <p className="eyebrow-pill">You&apos;re open</p>
          <h2 className="mt-5 font-display text-4xl leading-none font-extrabold tracking-[-0.04em]">
            {seller.shop_name} is live.
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-white/70">
            Your storefront is public at{" "}
            <Link href={`/shop/${seller.handle}`} className="text-reef underline">
              /shop/{seller.handle}
            </Link>
            . Connect Stripe next so buyers can pay you, then put something on the
            rack.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/dashboard/shop" className="btn btn-lime">
              Connect payouts
            </Link>
            <Link href="/dashboard/items/new" className="btn btn-ghost-light">
              List your first piece
            </Link>
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map(([label, value, href]) => (
          <Link
            key={label}
            href={href}
            className="rounded-[1.4rem] bg-paper-dim p-5 ring-1 ring-line transition hover:-translate-y-1"
          >
            <p className="eyebrow text-ink-faint">{label}</p>
            <p className="mt-2 font-display text-2xl font-extrabold tracking-tight">{value}</p>
          </Link>
        ))}
      </section>

      {insights ? (
        <section className="panel p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-extrabold tracking-tight">
              Shop insights
            </h2>
            <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
              Verified
            </p>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Rack value", money(insights.stock_value_cents)],
              ["Live on rack", String(insights.live_listings)],
              ["Spotlights", String(insights.spotlights)],
              ["Paid orders (7d)", String(insights.paid_orders_7d)],
              ["Earned (7d)", money(insights.earned_cents_7d)],
              ["Buyer chats (7d)", String(insights.threads_7d)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-paper-dim px-4 py-3">
                <dt className="text-xs font-bold tracking-wider text-ink-faint uppercase">
                  {label}
                </dt>
                <dd className="mt-1 font-display text-lg font-extrabold tracking-tight">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : (
        <section className="panel p-6">
          <h2 className="font-display text-xl font-extrabold tracking-tight">
            Shop insights
          </h2>
          <p className="mt-2 max-w-lg text-sm text-ink-soft">
            Verified shops get rack value, 7-day sales, spotlight count, and chat
            activity on this dashboard.
          </p>
          <Link href="/dashboard/shop" className="btn btn-ink mt-4">
            Get Verified — ${SELLER_PLAN_PRICE_USD}/mo
          </Link>
        </section>
      )}

      {setupNeeded.length > 0 && (
        <section className="panel p-6">
          <h2 className="font-display text-xl font-extrabold tracking-tight">
            Finish setting up
          </h2>
          <ul className="mt-4 space-y-2.5">
            {setupNeeded.map(([label, href]) => (
              <li key={label}>
                <Link
                  href={href}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-paper-dim px-4 py-3 text-sm font-semibold transition hover:bg-reef hover:text-white"
                >
                  {label}
                  <span aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-extrabold tracking-tight">
              Latest orders
            </h2>
            <Link href="/dashboard/orders" className="text-sm font-semibold underline hover:text-reef-dark">
              All orders
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="panel mt-4 px-5 py-12 text-center text-sm text-ink-soft">
              No orders yet. They land here the moment a buyer checks out.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {recent.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper-dim px-5 py-4 ring-1 ring-line"
                >
                  <div>
                    <p className="font-mono text-xs font-bold">{order.order_number}</p>
                    <p className="mt-0.5 text-sm">
                      {order.customer_name} · {order.lines.length}{" "}
                      {order.lines.length === 1 ? "piece" : "pieces"}
                    </p>
                    <p className="text-xs text-ink-faint">{shortDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-extrabold">
                      {money(order.total_cents)}
                    </p>
                    <p
                      className={`text-xs font-bold uppercase ${
                        order.payment_status === "paid" ? "text-kelp" : "text-coral"
                      }`}
                    >
                      {order.payment_status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel p-6">
          <h2 className="font-display text-xl font-extrabold tracking-tight">
            How you get paid
          </h2>
          {payoutReady ? (
            <>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                Buyers pay by card at checkout. Money goes to your Stripe account
                and then your bank — nothing passes through Thrift Sharks.
              </p>
              <p className="mt-4 inline-block rounded-full bg-kelp/15 px-3 py-1 text-xs font-bold uppercase text-kelp">
                Payouts ready
              </p>
              <Link
                href="/dashboard/shop"
                className="mt-4 block text-center text-sm underline hover:text-reef-dark"
              >
                Manage payouts
              </Link>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-ink-soft">
                Connect Stripe so buyers can check out. Listings will not sell until
                card payments are enabled.
              </p>
              <Link href="/dashboard/shop" className="btn btn-lime mt-5 w-full">
                Connect Stripe
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
