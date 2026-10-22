import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ClearBag } from "@/components/clear-bag";
import { PayWithStripeButton } from "@/components/pay-with-stripe-button";
import { ReviewForm } from "@/components/review-form";
import { ShopAvatar } from "@/components/shop-avatar";
import { Stars } from "@/components/stars";
import { money, shortDate } from "@/lib/format";
import { getOrderByNumber, getOrderGroup, reviewsForOrders } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order placed",
  robots: { index: false },
};

export default async function OrderPage(props: PageProps<"/order/[token]">) {
  const { token } = await props.params;
  const search = await props.searchParams;
  const paidFlag = search.paid === "1";
  const cancelledFlag = search.cancelled === "1";

  let orders = await getOrderGroup(token);
  if (orders.length === 0) {
    const single = await getOrderByNumber(token);
    if (single) orders = [single];
  }
  if (orders.length === 0) notFound();

  const existingReviews = await reviewsForOrders(orders.map((o) => o.id));
  const reviewByOrder = new Map(existingReviews.map((r) => [r.order_id, r]));

  const first = orders[0];
  const grandTotal = orders.reduce((sum, o) => sum + o.total_cents, 0);
  const allItemIds = orders.flatMap((o) =>
    o.lines.map((l) => l.item_id ?? 0).filter(Boolean),
  );
  const multi = orders.length > 1;
  const allPaid = orders.every((o) => o.payment_status === "paid");

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

      <header className="rounded-[2rem] bg-void p-6 text-white sm:p-12">
        <p className="eyebrow-pill">
          {multi ? `${orders.length} shops · ${orders.length} orders` : `Order ${first.order_number}`}
        </p>
        <h1 className="mt-5 font-display text-4xl leading-[0.9] font-extrabold tracking-[-0.05em] break-anywhere sm:text-5xl">
          {allPaid
            ? `Paid — thanks, ${first.customer_name.split(" ")[0]}.`
            : `Caught it, ${first.customer_name.split(" ")[0]}.`}
        </h1>
        <p className="mt-5 max-w-xl leading-relaxed text-white/70">
          {allPaid
            ? multi
              ? "Every shop on this bag is paid. Sellers will ship (or arrange pickup) next."
              : "Payment received. The seller will ship (or arrange pickup) next."
            : multi
              ? "Items from different shops mean one secure payment per shop. Pay each shop below."
              : "Pay the seller securely below. Money goes to their Stripe account — we never hold it."}
        </p>
        {(paidFlag || cancelledFlag) && !allPaid && (
          <p className="mt-4 text-sm text-white/80">
            {paidFlag
              ? "If you just paid, give it a few seconds — this page updates when Stripe confirms."
              : "Checkout was cancelled. You can try again below."}
          </p>
        )}
        <p className="mt-7 font-display text-3xl font-extrabold text-reef">
          {money(grandTotal)} total
        </p>
      </header>

      <ol className="mt-8 space-y-6">
        {orders.map((order, index) => {
          const stripeReady =
            order.seller_stripe_charges_enabled && Boolean(order.seller_stripe_account_id);
          const isPaid = order.payment_status === "paid";

          return (
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
                  <span className="rounded-full bg-void px-3 py-1 text-xs font-bold text-white">
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
                      <dd>
                        {order.shipping_cents === 0
                          ? order.fulfilment === "pickup"
                            ? "Pickup"
                            : "—"
                          : money(order.shipping_cents)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-soft">Platform fee</dt>
                      <dd>{money(order.platform_fee_cents ?? 0)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-line pt-2 font-display text-lg font-extrabold">
                      <dt>Pay this shop</dt>
                      <dd>{money(order.total_cents)}</dd>
                    </div>
                  </dl>

                  <p
                    className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${
                      isPaid ? "bg-kelp/15 text-kelp" : "bg-coral/15 text-coral"
                    }`}
                  >
                    {isPaid ? "Payment received" : "Awaiting your payment"}
                  </p>
                </div>

                <div className="justify-self-start space-y-3 lg:justify-self-end">
                  {!isPaid && stripeReady && (
                    <div className="rounded-[1.5rem] bg-paper-dim p-4 ring-1 ring-line">
                      <p className="mb-3 text-xs font-bold tracking-wider text-ink-faint uppercase">
                        Secure checkout
                      </p>
                      <PayWithStripeButton
                        orderId={order.id}
                        token={token}
                        amountLabel={money(order.total_cents)}
                      />
                      <p className="mt-3 max-w-56 text-xs leading-relaxed text-ink-soft">
                        Card payment to {order.seller_shop_name}. Stripe settles to the
                        seller — Thrift Sharks never holds the funds.
                      </p>
                    </div>
                  )}

                  {!isPaid && !stripeReady && (
                    <p className="max-w-56 rounded-2xl bg-paper-dim px-4 py-3 text-xs text-ink-soft">
                      This shop is not ready for card checkout. Contact them through the
                      shop or message us if you need help.
                    </p>
                  )}

                  {isPaid && (
                    <p className="max-w-56 rounded-2xl bg-kelp/10 px-4 py-3 text-sm text-ink">
                      Paid via Stripe. The shop has your order.
                    </p>
                  )}

                  {isPaid && order.seller_id && (
                    <div className="max-w-md pt-2">
                      {reviewByOrder.get(order.id) ? (
                        <div className="rounded-2xl bg-paper-dim px-4 py-3">
                          <p className="text-xs font-bold tracking-wider text-ink-faint uppercase">
                            Your review
                          </p>
                          <p className="mt-1">
                            <Stars rating={reviewByOrder.get(order.id)!.rating} />
                          </p>
                          {reviewByOrder.get(order.id)!.body && (
                            <p className="mt-1 text-sm text-ink-soft">
                              {reviewByOrder.get(order.id)!.body}
                            </p>
                          )}
                        </div>
                      ) : (
                        <ReviewForm orderId={order.id} token={token} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <section className="mt-10 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="eyebrow text-ink-faint">What happens next</h2>
          <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-ink-soft">
            <li>
              <strong className="text-ink">1.</strong> Pay each shop above with secure card
              checkout.
            </li>
            <li>
              <strong className="text-ink">2.</strong> Stripe marks the order paid when the
              charge succeeds.
            </li>
            <li>
              <strong className="text-ink">3.</strong>{" "}
              {first.fulfilment === "pickup"
                ? "Arrange collection with the shop directly."
                : "They ship within a couple of days and email you from their shop."}
            </li>
          </ol>
          <p className="mt-4 text-xs text-ink-faint">
            Placed {shortDate(first.created_at)}. Bookmark this page — it is your receipt.
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
