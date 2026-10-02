import Image from "next/image";
import Link from "next/link";
import { money, shortDate } from "@/lib/format";
import { cashappUrl } from "@/lib/images";
import { requireSeller } from "@/lib/seller-auth";
import { sellerOrders, sellerStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardHome(props: PageProps<"/dashboard">) {
  const seller = await requireSeller();
  const params = await props.searchParams;
  const welcome = (Array.isArray(params.welcome) ? params.welcome[0] : params.welcome) === "1";

  const [stats, orders] = await Promise.all([
    sellerStats(seller.id),
    sellerOrders(seller.id),
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
  const setupNeeded = [
    !seller.logo_image_id && ["Add your logo", "/dashboard/shop"],
    !seller.bio && ["Write a shop bio", "/dashboard/shop"],
    stats.available === 0 && ["List your first piece", "/dashboard/items/new"],
  ].filter(Boolean) as [string, string][];

  return (
    <div className="space-y-12">
      {welcome && (
        <section className="rounded-[2rem] bg-ink p-8 text-paper sm:p-10">
          <p className="eyebrow-pill">You&apos;re open</p>
          <h2 className="mt-5 font-display text-4xl leading-none font-extrabold tracking-[-0.04em]">
            {seller.shop_name} is live.
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-paper/70">
            Your storefront is public at{" "}
            <Link href={`/shop/${seller.handle}`} className="text-reef underline">
              /shop/{seller.handle}
            </Link>
            . Your Cash App code is already generated, so the next step is
            putting something on the rack.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/dashboard/items/new" className="btn btn-lime">
              List your first piece
            </Link>
            <Link href="/dashboard/shop" className="btn btn-ghost-light">
              Add your logo
            </Link>
          </div>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map(([label, value, href]) => (
          <Link
            key={label}
            href={href}
            className="rounded-[1.4rem] bg-white p-5 ring-1 ring-black/5 transition hover:-translate-y-1"
          >
            <p className="eyebrow text-ink-faint">{label}</p>
            <p className="mt-2 font-display text-2xl font-extrabold tracking-tight">{value}</p>
          </Link>
        ))}
      </section>

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
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 ring-1 ring-black/5"
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
          {seller.cashapp_tag ? (
            <>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                Buyers see this code on every order from your shop and send the
                total straight to you. Nothing passes through Thrift Shark.
              </p>
              {seller.qr_image_id && (
                <div className="mt-5 rounded-2xl bg-white p-3 ring-1 ring-black/5">
                  <Image
                    src={`/api/images/${seller.qr_image_id}`}
                    alt={`Your Cash App code, $${seller.cashapp_tag}`}
                    width={240}
                    height={240}
                    className="mx-auto h-40 w-40"
                  />
                </div>
              )}
              <a
                href={cashappUrl(seller.cashapp_tag)}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-4 block text-center font-display text-xl font-extrabold text-reef-dark hover:underline"
              >
                ${seller.cashapp_tag}
              </a>
              <Link
                href="/dashboard/shop"
                className="mt-4 block text-center text-sm underline hover:text-reef-dark"
              >
                Change your $cashtag
              </Link>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-ink-soft">
                You have no $cashtag set, so buyers have no way to pay you.
              </p>
              <Link href="/dashboard/shop" className="btn btn-lime mt-5 w-full">
                Add your $cashtag
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
