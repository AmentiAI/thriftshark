import Link from "next/link";
import type { Metadata } from "next";
import { marketplaceStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sell your merch",
  description:
    "Open a free Thrift Shark shop: your own storefront and logo, your listings, paid straight to your Cash App. No fees, no approval queue.",
};

const FAQ = [
  {
    q: "What does it cost?",
    a: "Nothing. No listing fee, no monthly fee, and we take no cut of your sales. Buyers pay you directly over Cash App, so there is nothing for us to skim.",
  },
  {
    q: "How do I get paid?",
    a: "You add your $cashtag when you sign up and we turn it into a scannable Cash App code. It sits on your storefront and on every order from your shop. The buyer scans it and sends you the total.",
  },
  {
    q: "When do I know an order is real?",
    a: "An order appears in your dashboard the moment it is placed, with the buyer's address and what they owe. Watch for the Cash App payment, mark the order paid, then ship it.",
  },
  {
    q: "Can I sell more than one of something?",
    a: "Not yet. Every listing is one-of-one, which is what keeps the marketplace honest — when a piece sells it comes off the rack automatically so nobody can buy it twice.",
  },
  {
    q: "What can I list?",
    a: "Secondhand clothing, shoes, accessories and household oddities. Clean, accurately described and actually yours to sell. Anything misdescribed gets the shop suspended.",
  },
  {
    q: "Do I need a logo?",
    a: "No, but your shop looks far better with one. Until you upload one we show your initials. You can add a logo and a wide banner any time from your dashboard.",
  },
];

export default async function SellPage() {
  const stats = await marketplaceStats();

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="pointer-events-none absolute -top-32 -right-16 h-[30rem] w-[30rem] rounded-full bg-reef/25 blur-3xl" />
        <div className="wrap relative max-w-3xl py-20">
          <p className="eyebrow-pill">Sell on Thrift Shark</p>
          <h1 className="mt-6 font-display text-6xl leading-[0.88] font-extrabold tracking-[-0.05em] sm:text-7xl">
            Keep every
            <span className="block text-reef">dollar.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/70">
            Open your own storefront, put your logo on it, and list whatever you
            have. Buyers scan your Cash App code and pay you — not us. There is
            no fee and no waiting to be approved.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-lime">
              Open your shop free
            </Link>
            <Link href="/sellers" className="btn btn-ghost-light">
              See the {stats.shops} shops already here
            </Link>
          </div>
        </div>
      </section>

      <section className="wrap py-16">
        <h2 className="font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
          How it works
        </h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Sign up", "Shop name, your link, your $cashtag. About a minute, and your shop is public straight away."],
            ["Dress it up", "Upload a logo and banner, write a line about what you hunt for."],
            ["List your merch", "Up to six photos per piece, a price, a size and honest condition notes."],
            ["Ship and get paid", "Order lands in your dashboard, buyer scans your code, you post it out."],
          ].map(([title, body], i) => (
            <li key={title} className="rounded-[1.6rem] bg-white p-6 ring-1 ring-black/5">
              <p className="font-display text-4xl font-extrabold text-reef">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-display text-xl font-bold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap grid gap-12 pb-16 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="font-display text-3xl font-extrabold tracking-[-0.04em]">
            Questions sellers actually ask
          </h2>
          <dl className="mt-8 divide-y divide-line border-y border-line">
            {FAQ.map((entry) => (
              <div key={entry.q} className="py-5">
                <dt className="font-display text-lg font-bold tracking-tight">{entry.q}</dt>
                <dd className="mt-2 leading-relaxed text-ink-soft">{entry.a}</dd>
              </div>
            ))}
          </dl>
        </div>

        <aside className="panel h-fit p-7 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            What you get
          </h2>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              "Your own storefront at /shop/your-name",
              "Your logo on every listing you post",
              "A generated, scannable Cash App code",
              "A dashboard for listings and orders",
              "Buyer addresses and order notes",
              "Zero fees, zero commission",
            ].map((line) => (
              <li key={line} className="flex gap-2.5">
                <span className="font-bold text-kelp">✓</span>
                <span className="text-ink-soft">{line}</span>
              </li>
            ))}
          </ul>
          <Link href="/signup" className="btn btn-lime mt-7 w-full">
            Open your shop
          </Link>
          <p className="mt-4 text-center text-xs text-ink-faint">
            Already selling?{" "}
            <Link href="/login" className="underline hover:text-reef-dark">
              Sign in
            </Link>
          </p>
        </aside>
      </section>
    </>
  );
}
