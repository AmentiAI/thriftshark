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
    ["Stock", sold ? "Sold" : "1 of 1"],
  ].filter(([, value]) => Boolean(value)) as [string, string][];

  return (
    <div className="wrap py-8 sm:py-10">
      <nav className="mb-5 flex flex-wrap gap-2 text-xs text-ink-faint" aria-label="Breadcrumb">
        <Link href="/shop" className="hover:text-ink">
          Shop
        </Link>
        {item.category_slug && (
          <>
            <span>/</span>
            <Link href={`/shop?category=${item.category_slug}`} className="hover:text-ink">
              {item.category_name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ItemGallery images={item.images} title={item.title} />

        <div className="lg:sticky lg:top-36 lg:self-start">
          {item.featured && !sold && <p className="eyebrow-pill mb-2">Staff pick</p>}

          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            {item.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <p className="text-2xl font-semibold">{money(item.price_cents)}</p>
            {onSale && (
              <p className="text-sm text-ink-faint line-through">
                {money(item.compare_at_cents!)}
              </p>
            )}
          </div>

          <p className="mt-2 text-sm text-ink-faint">
            {item.price_cents >= FREE_SHIPPING_THRESHOLD_CENTS
              ? "Free shipping"
              : `Shipping $8 · free over ${money(FREE_SHIPPING_THRESHOLD_CENTS)}`}
          </p>

          {item.seller_handle && (
            <Link
              href={`/shop/${item.seller_handle}`}
              className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-line py-1.5 pr-3.5 pl-1.5 hover:border-ink"
            >
              <ShopAvatar
                shopName={item.seller_shop_name ?? item.seller_handle}
                logoImageId={item.seller_logo_image_id}
                size={32}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {item.seller_shop_name}
                </span>
                <span className="block text-xs text-ink-faint">@{item.seller_handle}</span>
              </span>
            </Link>
          )}

          <div className="mt-6 space-y-3">
            {auction && auction.status === "live" ? (
              <div className="rounded-xl border border-line p-5">
                <p className="flex items-center gap-2 text-xs font-semibold text-coral uppercase">
                  <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full text-coral" />
                  On auction
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  Current bid{" "}
                  <strong className="text-ink">
                    {money(auction.high_cents ?? auction.start_cents)}
                  </strong>
                </p>
                <Link href={`/auctions/${auction.id}`} className="btn btn-ink mt-4 w-full">
                  Place a bid
                </Link>
              </div>
            ) : (
              <AddToBag id={item.id} soldOut={sold} />
            )}

            {item.seller_handle && !sold && (
              <Link
                href={`/shop/${item.seller_handle}/message?item=${item.id}`}
                className="btn btn-ghost w-full"
              >
                Message seller
              </Link>
            )}
          </div>

          <div className="mt-8 border-t border-line pt-6">
            <h2 className="text-sm font-semibold">Details</h2>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-soft">
              {item.description || "No notes yet — message the seller with questions."}
            </p>
          </div>

          <dl className="mt-6 divide-y divide-line border-y border-line">
            {spec.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-2.5 text-sm">
                <dt className="text-ink-faint">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-line pt-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-xl font-bold tracking-tight">More like this</h2>
            <Link href="/shop" className="text-sm font-semibold text-ink-faint hover:text-ink">
              Shop all
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4">
            {related.map((r) => (
              <ItemCard key={r.id} item={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
