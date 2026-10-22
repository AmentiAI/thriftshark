import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { getItemById } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Thrift Sharks is a marketplace. Sellers keep their own goods. We take a fee and do not hold product or handle returns.",
};

const FAQ = [
  {
    q: "Do you hold the product?",
    a: "No. Thrift Sharks has no store and no warehouse. Sellers keep their own goods and ship them (or arrange pickup) after you pay. We never take possession of an item.",
  },
  {
    q: "Do you handle returns?",
    a: "No. A return, refund, or exchange is between you and the seller. Message that shop from the order or the listing. If a seller will not deal with a real problem, we can suspend the shop until it is handled. Suspending a shop does not mean we take the item or issue the refund.",
  },
  {
    q: "What do you charge?",
    a: "Sellers list for free. On a normal order the buyer pays a $5 platform fee per shop, and that fee is ours. The item price and the shipping charge go to the seller through Stripe.",
  },
  {
    q: "Who do I ask about a listing?",
    a: "The shop that listed it. They have the item, the measurements, and the photos. Use the message button on the listing or the shop page.",
  },
];

export default async function ContactPage(props: PageProps<"/contact">) {
  const params = await props.searchParams;
  const rawItem = Array.isArray(params.item) ? params.item[0] : params.item;
  const rawSubject = Array.isArray(params.subject) ? params.subject[0] : params.subject;

  const itemId = Number(rawItem);
  const item = Number.isInteger(itemId) && itemId > 0 ? await getItemById(itemId) : null;

  return (
    <div className="wrap py-12">
      <header className="pb-8">
        <p className="eyebrow-pill">Contact</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.04em] sm:mt-5 sm:text-5xl lg:text-6xl">
          Contact
        </h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Thrift Sharks is a marketplace where people buy and sell clothes, shoes,
          and more. We take a small fee, but we don&apos;t hold products or handle
          returns. Questions about an item go to the shop that listed it.
        </p>
      </header>

      <div className="grid gap-14 pt-10 lg:grid-cols-[1.3fr_1fr]">
        <ContactForm
          itemId={item?.id}
          itemTitle={item?.title}
          defaultSubject={rawSubject}
        />

        <aside>
          <div>
            <h2 className="eyebrow text-ink-soft">Common questions</h2>
            <dl className="mt-4 space-y-3">
              {FAQ.map((entry) => (
                <div key={entry.q} className="rounded-2xl bg-paper-dim p-4 ring-1 ring-white/10">
                  <dt className="font-semibold">{entry.q}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-ink-soft">{entry.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
