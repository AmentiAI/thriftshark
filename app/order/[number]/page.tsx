import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ClearBag } from "@/components/clear-bag";
import { money, shortDate } from "@/lib/format";
import { getOrderByNumber } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export default async function OrderPage(props: PageProps<"/order/[number]">) {
  const { number } = await props.params;
  const order = await getOrderByNumber(number);
  if (!order) notFound();

  const address = [
    order.address_line1,
    order.address_line2,
    [order.city, order.region].filter(Boolean).join(", "),
    order.postal_code,
    order.country,
  ].filter(Boolean);

  return (
    <div className="wrap max-w-3xl py-16">
      <ClearBag itemIds={order.lines.map((l) => l.item_id ?? 0).filter(Boolean)} />

      <div className="border border-line bg-paper-dim/40 p-8 sm:p-12">
        <p className="eyebrow text-reef-dark">Order {order.order_number}</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
          Caught it. Thank you, {order.customer_name.split(" ")[0]}.
        </h1>
        <p className="mt-4 leading-relaxed text-ink-soft">
          {order.lines.length === 1 ? "Your piece is" : "Your pieces are"} off the
          rack and set aside under your name. We have emailed{" "}
          <strong className="text-ink">{order.email}</strong> a payment link — once
          that clears,{" "}
          {order.fulfilment === "pickup"
            ? "come by the shop any day we are open and ask for your order number."
            : "we pack and ship within two working days."}
        </p>

        <dl className="mt-8 grid gap-4 border-t border-line pt-6 text-sm sm:grid-cols-3">
          <div>
            <dt className="eyebrow text-ink-faint">Placed</dt>
            <dd className="mt-1 font-medium">{shortDate(order.created_at)}</dd>
          </div>
          <div>
            <dt className="eyebrow text-ink-faint">Payment</dt>
            <dd className="mt-1 font-medium capitalize">{order.payment_status}</dd>
          </div>
          <div>
            <dt className="eyebrow text-ink-faint">Method</dt>
            <dd className="mt-1 font-medium">
              {order.fulfilment === "pickup" ? "Store pickup" : "Shipped"}
            </dd>
          </div>
        </dl>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold">What you got</h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {order.lines.map((line) => (
            <li key={line.id} className="flex justify-between gap-4 py-4">
              <div>
                {line.slug ? (
                  <Link href={`/item/${line.slug}`} className="font-medium hover:text-reef-dark">
                    {line.title}
                  </Link>
                ) : (
                  <span className="font-medium">{line.title}</span>
                )}
              </div>
              <p className="shrink-0 font-semibold">{money(line.price_cents)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-5 ml-auto max-w-xs space-y-2 text-sm">
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
          <div className="flex justify-between border-t border-line pt-2 font-display text-base font-bold">
            <dt>Total</dt>
            <dd>{money(order.total_cents)}</dd>
          </div>
        </dl>
      </section>

      {address.length > 0 && (
        <section className="mt-10 border-t border-line pt-8">
          <h2 className="eyebrow text-ink-soft">Shipping to</h2>
          <address className="mt-3 text-sm leading-relaxed not-italic text-ink-soft">
            {order.customer_name}
            <br />
            {address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        </section>
      )}

      <div className="mt-12 flex flex-wrap gap-3 border-t border-line pt-8">
        <Link href="/shop" className="bg-ink px-6 py-3.5 text-sm font-semibold tracking-wide text-paper uppercase">
          Keep shopping
        </Link>
        <Link href="/contact" className="border border-ink px-6 py-3.5 text-sm font-semibold tracking-wide uppercase">
          Question about this order
        </Link>
      </div>
      <p className="mt-4 text-xs text-ink-faint">
        Keep this page bookmarked — it is your receipt. Order {order.order_number}.
      </p>
    </div>
  );
}
