import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { getItemById } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact & returns",
  description:
    "Ask about a piece, request a measurement, or start a return. We reply within a day.",
};

const FAQ = [
  {
    q: "Can you hold something for me?",
    a: "Only through checkout. Placing an order takes the piece off the rack immediately, and we invoice afterwards — that is as close to a hold as we get, because single-piece stock makes informal holds unfair to everyone else.",
  },
  {
    q: "Can I get another measurement?",
    a: "Yes, always. Tell us the piece and what you need measured and we will go and measure it. It is usually the same afternoon.",
  },
  {
    q: "What is your returns policy?",
    a: "Fourteen days from delivery, refunded in full once it is back with us in the condition it left. Return shipping is on you unless we described something wrong. Flaws listed in the description are not grounds for return, which is exactly why we photograph them.",
  },
  {
    q: "How fast do you ship?",
    a: "Within two working days of payment clearing, tracked. Pickup orders are ready the same day during opening hours.",
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
        <h1 className="mt-5 font-display text-5xl font-extrabold tracking-[-0.05em] sm:text-6xl">
          Ask us anything
        </h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Measurements, fit advice, returns, trade-ins, or whether that coat is
          as green as it looks. A real person reads these.
        </p>
      </header>

      <div className="grid gap-14 pt-10 lg:grid-cols-[1.3fr_1fr]">
        <ContactForm
          itemId={item?.id}
          itemTitle={item?.title}
          defaultSubject={rawSubject}
        />

        <aside className="space-y-10">
          <div>
            <h2 className="eyebrow text-ink-soft">Find us</h2>
            <address className="mt-3 text-sm leading-relaxed not-italic text-ink-soft">
              218 Harbour Road
              <br />
              Open Wednesday – Sunday, 11am – 7pm
              <br />
              Closed Monday and Tuesday for sorting
            </address>
          </div>

          <div>
            <h2 className="eyebrow text-ink-soft">Common questions</h2>
            <dl className="mt-4 space-y-3">
              {FAQ.map((entry) => (
                <div key={entry.q} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
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
