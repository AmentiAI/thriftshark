import Link from "next/link";
import type { Metadata } from "next";
import { marketplaceStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sell on Thrift Sharks",
  description:
    "Open a free Thrift Sharks shop and sell clothes, shoes, accessories, and more. Your storefront, your listings, paid through Stripe.",
};

const FAQ = [
  {
    q: "What does it cost?",
    a: "Opening a shop and listing is free. Buyers pay a $5 platform fee per shop order, plus Stripe’s card fee, unless the buyer’s own account is Verified. Optional Verified is $20 for 30 days — badge, auctions, more photos, and directory boost. It drops when the 30 days end.",
  },
  {
    q: "What is Verified?",
    a: "A $20 pass that lasts 30 days: verified badge, auctions, up to 20 photos, unlimited live listings, homepage spotlights, sale pricing, search priority, and dashboard insights. You’ll get a message a day before it ends so you can pay again.",
  },
  {
    q: "How do I get paid?",
    a: "Connect Stripe on your storefront. Buyers pay by card at checkout; you receive the item price plus a $9.99 shipping fee. The $5 platform fee goes to Thrift Sharks unless the buyer is Verified.",
  },
  {
    q: "Who handles shipping?",
    a: "You ship (or arrange local pickup). Buyers pay a flat $9.99 shipping fee per order that goes to you — use it for postage. Thrift Sharks never has the item.",
  },
  {
    q: "What about returns?",
    a: "You do. Thrift Sharks does not handle returns and does not hold product. If an order is left unresolved, the shop can be suspended until it is handled.",
  },
  {
    q: "When do I know an order is real?",
    a: "It hits your dashboard with the address and amount. Stripe marks it paid when the charge succeeds, then you ship.",
  },
  {
    q: "Can I sell multiples?",
    a: "Not yet. Each listing is a single item. When it sells, it comes down. Have more than one? List each one separately.",
  },
  {
    q: "What can I sell?",
    a: "Clothes, shoes, accessories, bags, and other things you own: home goods, collectibles, oddities. New or used is fine as long as you describe it honestly. Stolen, counterfeit, and prohibited items are not allowed (see the Terms).",
  },
];

export default async function SellPage() {
  const stats = await marketplaceStats();

  return (
    <>
      <section className="border-b border-line">
        <div className="wrap max-w-2xl py-12 sm:py-16">
          <p className="eyebrow-pill">Sell on Thrift Sharks</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.035em] sm:text-5xl">
            Sell without listing fees
          </h1>
          <p className="mt-4 text-base text-ink-soft sm:text-lg">
            Sell clothes, shoes, and anything else you own from your own
            storefront, paid out through Stripe. Buyers cover a $5 platform fee
            per order unless their account is Verified.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-ink">
              Open your shop free
            </Link>
            <Link href="/sellers" className="btn btn-ghost">
              See {stats.shops} shops
            </Link>
          </div>
        </div>
      </section>

      <section className="wrap py-12">
        <h2 className="font-display text-2xl font-bold tracking-tight">How it works</h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["01", "Sign up", "Shop name and handle."],
            ["02", "Connect Stripe", "Finish payout setup so buyers can pay."],
            ["03", "List", "Photos, price, size, condition — auctions with Verified."],
            ["04", "Get paid", "A buyer checks out, the money goes to you, and you ship."],
          ].map(([n, title, body]) => (
            <li key={title} className="rounded-xl border border-line p-5">
              <p className="text-xs font-semibold text-ink-faint">{n}</p>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-line">
        <div className="wrap grid gap-10 py-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">FAQ</h2>
            <dl className="mt-6 divide-y divide-line border-y border-line">
              {FAQ.map((entry) => (
                <div key={entry.q} className="py-5">
                  <dt className="font-semibold">{entry.q}</dt>
                  <dd className="mt-1.5 text-sm text-ink-soft">{entry.a}</dd>
                </div>
              ))}
            </dl>
          </div>
          <aside className="rounded-xl border border-line bg-paper-dim p-6 lg:self-start">
            <h2 className="font-display text-xl font-bold tracking-tight">Ready?</h2>
            <p className="mt-2 text-sm text-ink-soft">
              {stats.shops} shops · {stats.listings} items for sale
            </p>
            <Link href="/signup" className="btn btn-ink mt-5 w-full">
              Create your shop
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
