import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AddToBag } from "@/components/add-to-bag";
import { ItemCard } from "@/components/item-card";
import { ItemGallery } from "@/components/item-gallery";
import { money } from "@/lib/format";
import { getItemBySlug, getRelatedItems } from "@/lib/queries";
import { conditionLabel, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/item/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const item = await getItemBySlug(slug);
  if (!item) return { title: "Item not found" };

  return {
    title: item.title,
    description: item.description.slice(0, 160),
    openGraph: {
      title: item.title,
      description: item.description.slice(0, 160),
      images: item.images[0] ? [item.images[0].url] : [],
    },
  };
}

export default async function ItemPage(props: PageProps<"/item/[slug]">) {
  const { slug } = await props.params;
  const item = await getItemBySlug(slug);
  if (!item || item.status === "draft") notFound();

  const related = await getRelatedItems(item, 4);
  const sold = item.status !== "available";
  const onSale = !!item.compare_at_cents && item.compare_at_cents > item.price_cents;

  const spec = [
    ["Brand", item.brand],
    ["Size", item.item_size],
    ["Condition", conditionLabel(item.condition)],
    ["Colour", item.color],
    ["Category", item.category_name],
    ["Stock", sold ? "Sold" : "1 available"],
  ].filter(([, value]) => Boolean(value)) as [string, string][];

  return (
    <div className="wrap py-10">
      <nav className="mb-8 flex flex-wrap gap-2 text-xs text-ink-faint" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-ink">Shop</Link>
        {item.category_slug && (
          <>
            <span>/</span>
            <Link href={`/shop?category=${item.category_slug}`} className="hover:text-ink">
              {item.category_name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        <ItemGallery images={item.images} title={item.title} />

        <div className="lg:py-2">
          {item.featured && !sold && (
            <p className="eyebrow mb-3 inline-block bg-reef px-2 py-1 text-ink">Staff pick</p>
          )}
          <h1 className="font-display text-4xl leading-tight font-bold tracking-tight">
            {item.title}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <p className="font-display text-3xl font-bold">{money(item.price_cents)}</p>
            {onSale && (
              <>
                <p className="text-lg text-ink-faint line-through">
                  {money(item.compare_at_cents!)}
                </p>
                <p className="eyebrow bg-coral px-2 py-1 text-white">
                  Save {money(item.compare_at_cents! - item.price_cents)}
                </p>
              </>
            )}
          </div>

          <p className="mt-2 text-sm text-ink-soft">
            {item.price_cents >= FREE_SHIPPING_THRESHOLD_CENTS
              ? "Free shipping on this one."
              : `Flat $8 shipping · free over ${money(FREE_SHIPPING_THRESHOLD_CENTS)}`}
            {" · "}in-store pickup available
          </p>

          <div className="mt-8">
            <AddToBag id={item.id} soldOut={sold} />
          </div>

          <div className="mt-10 border-t border-line pt-8">
            <h2 className="eyebrow text-ink-soft">The honest description</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-ink-soft">
              {item.description || "No notes on this one yet — ask us anything."}
            </p>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 border-t border-line pt-8 text-sm">
            {spec.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 border-b border-line/60 py-2.5">
                <dt className="text-ink-faint">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 space-y-2 border-t border-line pt-8 text-sm text-ink-soft">
            <p>
              <strong className="text-ink">Returns:</strong> 14 days, as long as it
              comes back the way it left. Flaws noted above are not grounds for return.
            </p>
            <p>
              <strong className="text-ink">Questions?</strong>{" "}
              <Link href={`/contact?item=${item.id}`} className="underline hover:text-reef-dark">
                Ask about this piece
              </Link>{" "}
              and we will measure anything you need.
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24 border-t border-line pt-10">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Others you might circle
          </h2>
          <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <ItemCard key={r.id} item={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
