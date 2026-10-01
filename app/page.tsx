import Link from "next/link";
import Image from "next/image";
import { ItemCard } from "@/components/item-card";
import { SharkMark } from "@/components/logo";
import { getCategories, getCategoryCounts, getFeaturedItems, getLatestItems } from "@/lib/queries";

export const dynamic = "force-dynamic";

const PROMISES = [
  {
    title: "Measured, not guessed",
    body: "Every listing carries real flat measurements, so you know it fits before it ships.",
  },
  {
    title: "Flaws photographed",
    body: "If there is a pinhole, a mend or a scuff, you will see it in the photos and read it in the notes.",
  },
  {
    title: "Washed and ready",
    body: "Everything is cleaned, de-linted and pressed before it goes up. No musty surprises.",
  },
  {
    title: "One of one",
    body: "Single-piece inventory. When a thing sells it is gone, which is half the fun.",
  },
];

export default async function HomePage() {
  const [featured, latest, categories, counts] = await Promise.all([
    getFeaturedItems(4),
    getLatestItems(8),
    getCategories(),
    getCategoryCounts(),
  ]);

  const hero = featured[0] ?? latest[0];

  return (
    <>
      {/* Hero */}
      <section className="bg-ink text-paper">
        <div className="hatch">
          <div className="wrap grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
            <div>
              <p className="eyebrow flex items-center gap-2 text-reef">
                <SharkMark className="h-4 w-4" />
                Secondhand, first choice
              </p>
              <h1 className="mt-5 font-display text-5xl leading-[0.95] font-bold tracking-tight sm:text-6xl lg:text-7xl">
                We sift the racks
                <span className="block text-reef">so you don&apos;t have to.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-paper/75">
                Thrift Shark is a one-room shop that goes through thousands of
                pieces a month and keeps the handful worth keeping. Each one is
                photographed, measured and listed exactly once.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="bg-reef px-7 py-4 text-sm font-semibold tracking-wide text-ink uppercase transition hover:bg-paper"
                >
                  Shop the racks
                </Link>
                <Link
                  href="/sell"
                  className="border border-paper/40 px-7 py-4 text-sm font-semibold tracking-wide uppercase transition hover:border-reef hover:text-reef"
                >
                  Sell to us
                </Link>
              </div>
              <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-paper/15 pt-6">
                {[
                  [String(Object.values(counts).reduce((a, b) => a + b, 0)), "pieces in stock"],
                  ["48hr", "dispatch"],
                  ["14 day", "returns"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="font-display text-2xl font-bold text-reef">{value}</dt>
                    <dd className="mt-0.5 text-xs text-paper/60">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {hero?.images?.[0] && (
              <Link href={`/item/${hero.slug}`} className="group relative block">
                <div className="relative aspect-4/5 overflow-hidden">
                  <Image
                    src={hero.images[0].url}
                    alt={hero.images[0].alt ?? hero.title}
                    fill
                    priority
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="absolute bottom-0 left-0 m-4 max-w-xs bg-paper p-5 text-ink">
                  <p className="eyebrow text-reef-dark">This week&apos;s catch</p>
                  <p className="mt-2 font-display text-lg leading-snug font-bold">
                    {hero.title}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {[hero.brand, hero.item_size && `Size ${hero.item_size}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="wrap py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-bold tracking-tight">
            Dig through
          </h2>
          <Link href="/shop" className="text-sm font-medium underline hover:text-reef-dark">
            All categories
          </Link>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className="group flex flex-col justify-between border border-line bg-paper-dim/50 p-5 transition hover:border-ink hover:bg-paper-dim"
            >
              <div>
                <h3 className="font-display text-lg leading-snug font-semibold group-hover:text-reef-dark">
                  {c.name}
                </h3>
                {c.blurb && (
                  <p className="mt-1.5 text-sm leading-snug text-ink-soft">{c.blurb}</p>
                )}
              </div>
              <p className="eyebrow mt-5 text-ink-faint">
                {counts[c.slug] ?? 0} in stock →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Staff picks */}
      {featured.length > 0 && (
        <section className="wrap pb-16">
          <div className="flex items-end justify-between gap-4 border-t border-line pt-10">
            <div>
              <p className="eyebrow text-reef-dark">Staff picks</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
                The ones we fought over
              </h2>
            </div>
            <Link href="/shop" className="hidden text-sm font-medium underline hover:text-reef-dark sm:block">
              Shop all
            </Link>
          </div>
          <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((item, i) => (
              <ItemCard key={item.id} item={item} priority={i < 2} />
            ))}
          </div>
        </section>
      )}

      {/* Promises */}
      <section className="bg-paper-dim py-16">
        <div className="wrap">
          <h2 className="font-display text-3xl font-bold tracking-tight">
            How we list things
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PROMISES.map((p, i) => (
              <div key={p.title}>
                <p className="font-display text-3xl font-bold text-reef">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest */}
      <section className="wrap py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-reef-dark">Just landed</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
              Fresh off the rack
            </h2>
          </div>
          <Link href="/shop?sort=newest" className="text-sm font-medium underline hover:text-reef-dark">
            See everything new
          </Link>
        </div>
        <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </>
  );
}
