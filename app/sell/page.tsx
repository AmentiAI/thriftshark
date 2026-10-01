import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sell or trade in",
  description:
    "We buy good secondhand clothing weekly: cash, store credit at a better rate, or whole-wardrobe clear-outs.",
};

const TAKE = [
  "Well-made denim, workwear and outerwear of any era",
  "Natural fibres: wool, cotton, linen, silk, real leather",
  "Band and event tees from before about 2005",
  "Boots and shoes with life left in the sole",
  "Bags, belts and costume jewellery with some weight to them",
];

const PASS = [
  "Fast fashion and anything printed on polyester mesh",
  "Pieces with stains, odour or damage we cannot reverse",
  "Underwear, swimwear and single socks",
  "Anything that smells of smoke — we cannot get it out",
];

export default function SellPage() {
  return (
    <>
      <section className="bg-ink text-paper">
        <div className="hatch">
          <div className="wrap max-w-3xl py-20">
            <p className="eyebrow text-reef">Sell or trade in</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.02] font-bold tracking-tight">
              Bring us the good stuff.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-paper/75">
              We buy every Wednesday to Sunday, no appointment needed for a bag
              or two. Cash on the spot, or 30% more in store credit if you would
              rather trade up.
            </p>
          </div>
        </div>
      </section>

      <section className="wrap grid gap-12 py-16 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">How it works</h2>
          <ol className="mt-8 space-y-7">
            {[
              ["Bring it in", "Clean and dry, in a bag or a box. We sort it with you at the counter — usually fifteen minutes for a couple of bags."],
              ["We make an offer", "A flat price for the lot, itemised if you want. Typically 30–40% of what we expect it to sell for, which is where the honest number sits."],
              ["Cash or credit", "Cash immediately, or take 30% more as store credit that never expires. Whatever we pass on, you can take back or we will route it to a textile recycler for you."],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-5">
                <span className="font-display text-3xl leading-none font-bold text-reef">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1.5 leading-relaxed text-ink-soft">{body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-12 border border-line bg-paper-dim/50 p-6">
            <h3 className="font-display text-xl font-bold">Whole wardrobes</h3>
            <p className="mt-2 leading-relaxed text-ink-soft">
              Clearing an estate or a full closet? Send photos first and we will
              come to you within about twenty miles. We take the lot, pay for what
              we keep, and handle recycling for the rest.
            </p>
            <Link
              href="/contact?subject=Wardrobe%20clear-out"
              className="mt-5 inline-block bg-ink px-5 py-3 text-sm font-semibold tracking-wide text-paper uppercase"
            >
              Tell us about it
            </Link>
          </div>
        </div>

        <div className="space-y-8">
          <div className="border-t-2 border-kelp pt-5">
            <h2 className="eyebrow text-kelp">Yes please</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
              {TAKE.map((line) => (
                <li key={line} className="flex gap-2.5">
                  <span className="text-kelp">✓</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t-2 border-coral pt-5">
            <h2 className="eyebrow text-coral">Not for us</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
              {PASS.map((line) => (
                <li key={line} className="flex gap-2.5">
                  <span className="text-coral">✕</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm leading-relaxed text-ink-faint">
            Not sure? Bring it anyway. We would rather look and say no than have
            you throw out something good.
          </p>
        </div>
      </section>
    </>
  );
}
