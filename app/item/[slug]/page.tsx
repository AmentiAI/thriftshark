import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AddToBag } from "@/components/add-to-bag";
import { ItemCard } from "@/components/item-card";
import { ItemGallery } from "@/components/item-gallery";
import { ShopAvatar } from "@/components/shop-avatar";
import { money } from "@/lib/format";
import { getItemBySlug, getRelatedItems } from "@/lib/queries";
import { getAuctionByItemId } from "@/lib/auctions";
import { conditionLabel, FREE_SHIPPING_THRESHOLD_CENTS, imageSrc } from "@/lib/types";

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
      images: imageSrc(item.images[0]) ? [imageSrc(item.images[0])!] : [],
    },
  };
}

export default async function ItemPage(props: PageProps<"/item/[slug]">) {
  const { slug } = await props.params;
  const item = await getItemBySlug(slug);
  if (!item || item.status === "draft") notFound();

  const [related, auction] = await Promise.all([
    getRelatedItems(item, 4),
    item.status === "auction" ? getAuctionByItemId(item.id) : Promise.resolve(null),
  ]);
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
      <nav className="mb-8 flex flex-wrap gap-2 text-xs font-medium text-ink-faint" aria-label="Breadcrumb">
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

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ItemGallery images={item.images} title={item.title} />

        <div className="lg:sticky lg:top-44 lg:self-start">
          {item.featured && !sold && (
            <p className="eyebrow-pill mb-4">Staff pick</p>
          )}
          <h1 className="font-display text-4xl leading-[0.95] font-extrabold tracking-[-0.04em] sm:text-5xl">
            {item.title}
          </h1>

          {item.seller_handle && (
            <Link
              href={`/shop/${item.seller_handle}`}
              className="mt-4 inline-flex items-center gap-2.5 rounded-full bg-white py-1.5 pr-4 pl-1.5 ring-1 ring-black/5 transition hover:ring-ink"
            >
              <ShopAvatar
                shopName={item.seller_shop_name ?? item.seller_handle}
                logoImageId={item.seller_logo_image_id}
                size={30}
              />
              <span className="text-sm font-bold">{item.seller_shop_name}</span>
              <span className="text-xs text-ink-faint">Visit shop →</span>
            </Link>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <p className="font-display text-4xl font-extrabold tracking-tight">{money(item.price_cents)}</p>
            {onSale && (
              <>
                <p className="text-lg text-ink-faint line-through">
                  {money(item.compare_at_cents!)}
                </p>
                <p className="rounded-full bg-coral px-3 py-1 text-[11px] font-bold tracking-[0.12em] text-white uppercase">
                  Save {money(item.compare_at_cents! - item.price_cents)}
                </p>
              </>
            )}
          </div>

          <p className="mt-3 text-sm text-ink-soft">
            {item.price_cents >= FREE_SHIPPING_THRESHOLD_CENTS
              ? "Free shipping on this one."
              : `Flat $8 shipping · free over ${money(FREE_SHIPPING_THRESHOLD_CENTS)}`}
            {item.seller_cashapp_tag && (
              <>
                {" · paid to "}
                <span className="font-semibold text-ink">${item.seller_cashapp_tag}</span>
                {" on Cash App"}
              </>
            )}
          </p>

          <div className="mt-8">
            {auction && auction.status === "live" ? (
              <div className="panel p-5">
                <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-coral uppercase">
                  <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full text-coral" />
                  In the auction house
                </p>
                <p className="mt-3 text-sm text-ink-soft">
                  This piece is on the block rather than on sale at a fixed
                  price. Current bid{" "}
                  <strong className="text-ink">
                    {money(auction.high_cents ?? auction.start_cents)}
                  </strong>{" "}
                  with {auction.bid_count} bid{auction.bid_count === 1 ? "" : "s"}.
                </p>
                <Link href={`/auctions/${auction.id}`} className="btn btn-lime sheen mt-4 w-full">
                  Bid on this lot
                </Link>
              </div>
            ) : (
              <AddToBag id={item.id} soldOut={sold} />
            )}
          </div>

          <div className="mt-10">
            <h2 className="eyebrow text-ink-faint">The honest description</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-ink-soft">
              {item.description || "No notes on this one yet — ask us anything."}
            </p>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-3 text-sm">
            {spec.map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5">
                <dt className="text-[11px] font-bold tracking-[0.14em] text-ink-faint uppercase">{label}</dt>
                <dd className="mt-1 font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 space-y-2 text-sm text-ink-soft">
            <p>
              <strong className="text-ink">Who you are buying from:</strong>{" "}
              {item.seller_shop_name ?? "an independent shop"} on Thrift Shark. You
              pay them directly by scanning their Cash App code at checkout, and
              they ship it to you.
            </p>
            <p>
              <strong className="text-ink">Questions?</strong>{" "}
              <Link href={`/contact?item=${item.id}`} className="font-semibold underline">
                Ask about this piece
              </Link>{" "}
              and the shop will measure anything you need.
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-3xl font-extrabold tracking-tight">
            Others you might circle
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
            {related.map((r) => (
              <ItemCard key={r.id} item={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
