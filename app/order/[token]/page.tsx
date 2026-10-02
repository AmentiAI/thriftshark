import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ClearBag } from "@/components/clear-bag";
import { ShopAvatar } from "@/components/shop-avatar";
import { money, shortDate } from "@/lib/format";
import { cashappUrl } from "@/lib/images";
import { getOrderByNumber, getOrderGroup } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order placed",
  robots: { index: false },
};

export default async function OrderPage(props: PageProps<"/order/[token]">) {
  const { token } = await props.params;

  // New orders are looked up by their checkout group; a bare order number still
  // resolves so older receipt links keep working.
  let orders = await getOrderGroup(token);
  if (orders.length === 0) {
    const single = await getOrderByNumber(token);
    if (single) orders = [single];
  }
  if (orders.length === 0) notFound();

  const first = orders[0];
  const grandTotal = orders.reduce((sum, o) => sum + o.total_cents, 0);
  const allItemIds = orders.flatMap((o) =>
    o.lines.map((l) => l.item_id ?? 0).filter(Boolean),
  );
  const multi = orders.length > 1;

  const address = [
    first.address_line1,
    first.address_line2,
    [first.city, first.region].filter(Boolean).join(", "),
    first.postal_code,
    first.country,
  ].filter(Boolean);

  return (
    <div className="wrap max-w-4xl py-10 sm:py-14">
      <ClearBag itemIds={allItemIds} />

      <header className="rounded-[2rem] bg-ink p-6 text-paper sm:p-12">
        <p className="eyebrow-pill">
          {multi ? `${orders.length} shops · ${orders.length} orders` : `Order ${first.order_number}`}
        </p>
        <h1 className="mt-5 font-display text-4xl leading-[0.9] font-extrabold tracking-[-0.05em] break-anywhere sm:text-5xl">
          Caught it, {first.customer_name.split(" ")[0]}.
        </h1>
        <p className="mt-5 max-w-xl leading-relaxed text-paper/70">
          {multi
            ? "Your pieces came from different shops, so there is one order — and one payment — per shop. Scan each code below to pay each seller."
            : "Your piece is off the rack and held under your name. Scan the Cash App code below to pay the seller and they will ship it out."}
        </p>
        <p className="mt-7 font-display text-3xl font-extrabold text-reef">
          {money(grandTotal)} total
        </p>
      </header>

      <ol className="mt-8 space-y-6">
        {orders.map((order, index) => (
          <li key={order.id} className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-paper-dim/60 px-6 py-5">
              <div className="flex items-center gap-3">
                <ShopAvatar
                  shopName={order.seller_shop_name ?? "Shop"}
                  logoImageId={order.seller_logo_image_id}
                  size={44}
                />
                <div>
                  {order.seller_handle ? (
                    <Link
                      href={`/shop/${order.seller_handle}`}
                      className="font-display text-lg leading-tight font-extrabold tracking-tight hover:text-reef-dark"
                    >
                      {order.seller_shop_name}
                    </Link>
                  ) : (
                    <p className="font-display text-lg font-extrabold">Shop</p>
                  )}
                  <p className="font-mono text-xs text-ink-faint">{order.order_number}</p>
                </div>
              </div>
              {multi && (
                <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-paper">
                  Payment {index + 1} of {orders.length}
                </span>
              )}
            </div>

            <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.3fr_auto]">
              <div>
                <ul className="divide-y divide-line border-y border-line">
                  {order.lines.map((line) => (
                    <li key={line.id} className="flex justify-between gap-4 py-3">
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

                <dl className="mt-4 ml-auto max-w-xs space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Subtotal</dt>
                    <dd>{money(order.subtotal_cents)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">
                      {order.fulfilment === "pickup" ? "Pickup" : "Shipping"}
                    </dt>
                    <dd>{order.shipping_cents === 0 ? "Free" : money(order.shipping_cents)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-2 font-display text-lg font-extrabold">
                    <dt>Send this shop</dt>
                    <dd>{money(order.total_cents)}</dd>
                  </div>
                </dl>

                <p
                  className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${
                    order.payment_status === "paid"
                      ? "bg-kelp/15 text-kelp"
                      : "bg-coral/15 text-coral"
                  }`}
                >
                  {order.payment_status === "paid" ? "Payment received" : "Awaiting your payment"}
                </p>
              </div>

              {/* Scan to pay this shop */}
              <div className="justify-self-start lg:justify-self-end">
                {order.seller_qr_image_id ? (
                  <div className="rounded-[1.5rem] bg-white p-4 ring-1 ring-black/5">
                    <Image
                      src={`/api/images/${order.seller_qr_image_id}`}
                      alt={`Cash App code for $${order.seller_cashapp_tag}`}
                      width={240}
                      height={240}
                      className="h-44 w-44"
                    />
                    <p className="mt-3 text-center font-display text-lg font-extrabold">
                      ${order.seller_cashapp_tag}
                    </p>
                    <p className="mt-0.5 text-center text-xs font-bold text-ink-faint">
                      Send {money(order.total_cents)}
                    </p>
                  </div>
                ) : order.seller_cashapp_tag ? (
                  <a
                    href={cashappUrl(order.seller_cashapp_tag)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-lime"
                  >
                    Pay ${order.seller_cashapp_tag}
                  </a>
                ) : (
                  <p className="max-w-56 rounded-2xl bg-paper-dim px-4 py-3 text-xs text-ink-soft">
                    This shop has not set up Cash App yet. They will email you
                    payment details.
                  </p>
                )}

                {order.seller_cashapp_tag && (
                  <a
                    href={cashappUrl(order.seller_cashapp_tag)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-3 block text-center text-xs font-semibold underline hover:text-reef-dark"
                  >
                    Open in Cash App instead
                  </a>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-10 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="eyebrow text-ink-faint">What happens next</h2>
          <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-ink-soft">
            <li>
              <strong className="text-ink">1.</strong> Scan each code above and send
              that shop its exact total — add your order number in the Cash App note.
            </li>
            <li>
              <strong className="text-ink">2.</strong> The seller marks your order
              paid once it lands.
            </li>
            <li>
              <strong className="text-ink">3.</strong>{" "}
              {first.fulfilment === "pickup"
                ? "Arrange collection with the shop directly."
                : "They ship within a couple of days and email you from their shop."}
            </li>
          </ol>
          <p className="mt-4 text-xs text-ink-faint">
            Placed {shortDate(first.created_at)}. Bookmark this page — it is your
            receipt and your payment code.
          </p>
        </div>

        {address.length > 0 && (
          <div>
            <h2 className="eyebrow text-ink-faint">Shipping to</h2>
            <address className="mt-3 text-sm leading-relaxed text-ink-soft not-italic">
              {first.customer_name}
              <br />
              {address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </div>
        )}
      </section>

      <div className="mt-12 flex flex-wrap gap-3 border-t border-line pt-8">
        <Link href="/shop" className="btn btn-ink">
          Keep shopping
        </Link>
        <Link href="/contact" className="btn btn-ghost">
          Problem with this order
        </Link>
      </div>
    </div>
  );
}
