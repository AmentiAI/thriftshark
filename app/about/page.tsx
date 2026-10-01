import Link from "next/link";
import type { Metadata } from "next";
import { SharkMark } from "@/components/logo";

export const metadata: Metadata = {
  title: "About the shop",
  description:
    "Thrift Shark is a one-room secondhand shop that sorts thousands of pieces a month and keeps only what is worth keeping.",
};

const STEPS = [
  {
    title: "We sort",
    body: "Estate lots, rag-house bales, closet clear-outs. Most of it goes straight back out to recyclers. Maybe one piece in forty makes the cut.",
  },
  {
    title: "We clean",
    body: "Everything is laundered or dry-cleaned, de-pilled, de-linted and pressed. Hardware gets checked, zips get run, buttons get counted.",
  },
  {
    title: "We measure",
    body: "Flat measurements in inches, taken by hand, because a 1980s medium and a 2026 medium are not the same animal.",
  },
  {
    title: "We photograph",
    body: "Daylight, no filters, and a close-up of every flaw. If you are surprised when the parcel opens, we did our job badly.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-ink text-paper">
        <div className="hatch">
          <div className="wrap max-w-3xl py-20">
            <p className="eyebrow flex items-center gap-2 text-reef">
              <SharkMark className="h-4 w-4" />
              About Thrift Shark
            </p>
            <h1 className="mt-5 font-display text-5xl leading-[1.02] font-bold tracking-tight">
              Someone has to go through all of it.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-paper/75">
              Thrift Shark started in 2019 as two people, a van and a storage
              unit full of other people&apos;s decisions. The idea has not changed:
              do the digging so that everything on the rack is already worth your
              time.
            </p>
          </div>
        </div>
      </section>

      <section className="wrap max-w-3xl py-16">
        <div className="space-y-5 text-lg leading-relaxed text-ink-soft">
          <p>
            We are a single room on Harbour Road with a steamer in the corner and
            a very opinionated cat. Roughly four thousand garments pass through
            each month. Around a hundred get listed. The rest are sorted on to
            recyclers and textile reclaimers, because the point of secondhand is
            that nothing useful ends up in a hole in the ground.
          </p>
          <p>
            Because every piece is one of one, the shop works a little
            differently from a normal store. There is no restock, no second size,
            no &ldquo;back in two weeks.&rdquo; When something sells it leaves the
            site for good and lands in the sold archive, which is the closest
            thing we have to a catalogue of our taste.
          </p>
          <p>
            We would rather talk you out of a piece than have it come back. Ask
            us for an extra measurement, a photo in daylight, or an honest answer
            about whether that trench will actually suit you. We will give it.
          </p>
        </div>
      </section>

      <section className="bg-paper-dim py-16">
        <div className="wrap">
          <h2 className="font-display text-3xl font-bold tracking-tight">
            Four steps, every single piece
          </h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="border-t-2 border-ink pt-5">
                <p className="font-display text-sm font-bold text-reef-dark">
                  Step {i + 1}
                </p>
                <h3 className="mt-2 font-display text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap grid gap-10 py-16 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-bold">Come in person</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            218 Harbour Road. Open Wednesday to Sunday, 11am to 7pm. Roughly a
            third of our stock never makes it online, so the rail by the window
            is worth a look.
          </p>
          <p className="mt-3 text-sm text-ink-soft">
            Online orders can be collected in store at no charge — pick
            &ldquo;collect in store&rdquo; at checkout.
          </p>
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Work with us</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            We buy and trade in good secondhand clothing every week, and we take
            on the occasional whole-wardrobe clear-out.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/sell" className="bg-ink px-5 py-3 text-sm font-semibold tracking-wide text-paper uppercase">
              Sell to us
            </Link>
            <Link href="/contact" className="border border-ink px-5 py-3 text-sm font-semibold tracking-wide uppercase">
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
