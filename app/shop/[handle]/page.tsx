import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ItemCard } from "@/components/item-card";
import { ShopMasthead } from "@/components/shop-masthead";
import { money, shortDate } from "@/lib/format";
import { getSellerByHandle, searchItems } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/shop/[handle]">,
): Promise<Metadata> {
  const { handle } = await props.params;
  const seller = await getSellerByHandle(handle);
  if (!seller) return { title: "Shop not found" };

  return {
    title: seller.shop_name,
    description:
      seller.tagline ??
      seller.bio?.slice(0, 160) ??
      `${seller.shop_name} on Thrift Sharks — ${seller.item_count} one-of-one listings.`,
    openGraph: {
      title: seller.shop_name,
      description: seller.tagline ?? `${seller.item_count} listings on Thrift Sharks.`,
      images: seller.banner_image_id ? [`/api/images/${seller.banner_image_id}`] : [],
    },
  };
}

export default async function StorefrontPage(props: PageProps<"/shop/[handle]">) {
  const { handle } = await props.params;
  const params = await props.searchParams;
  const seller = await getSellerByHandle(handle);
  if (!seller) notFound();

  const showSold = (Array.isArray(params.sold) ? params.sold[0] : params.sold) === "1";
  const sort = Array.isArray(params.sort) ? params.sort[0] : params.sort;

  const { items } = await searchItems({
    seller: seller.handle,
    includeSold: showSold,
    sort,
    perPage: 60,
  });

  const stockValue = items
    .filter((i) => i.status === "available")
    .reduce((sum, i) => sum + i.price_cents, 0);

  return (
    <div className="wrap py-8 sm:py-10">
      <ShopMasthead
        shopName={seller.shop_name}
        bannerImageId={seller.banner_image_id}
        logoImageId={seller.logo_image_id}
        bannerX={seller.banner_x}
        bannerY={seller.banner_y}
        logoX={seller.logo_x}
        logoY={seller.logo_y}
        meta={
          <>
            <p className="break-anywhere">
              @{seller.handle}
              {seller.location && ` · ${seller.location}`}
            </p>
            <p className="text-xs">Joined {shortDate(seller.created_at)}</p>
          </>
        }
        actions={
          <Link
            href={`/shop/${seller.handle}/message`}
            className="btn btn-ink !px-3.5 !py-2 text-sm"
          >
            Message
          </Link>
        }
      >
        {(seller.tagline || seller.bio) && (
          <div className="mt-4 max-w-2xl">
            {seller.tagline && (
              <p className="text-base font-semibold tracking-tight">{seller.tagline}</p>
            )}
            {seller.bio && (
              <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-ink-soft">
                {seller.bio}
              </p>
            )}
          </div>
        )}

        <dl className="mt-5 flex flex-wrap gap-2">
          {[
            [`${seller.item_count}`, "for sale"],
            [`${seller.sold_count}`, "sold"],
            [money(stockValue), "on rack"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-full border border-line bg-paper-dim px-3.5 py-1.5 text-sm"
            >
              <dt className="inline font-semibold">{value}</dt>
              <dd className="ml-1.5 inline text-ink-faint">{label}</dd>
            </div>
          ))}
        </dl>
      </ShopMasthead>

      <section className="pt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            {showSold ? "All listings" : "For sale"}
          </h2>
          <div className="flex gap-2">
            <Link
              href={`/shop/${seller.handle}`}
              className={`btn !px-3.5 !py-2 text-sm ${showSold ? "btn-ghost" : "btn-ink"}`}
            >
              For sale
            </Link>
            <Link
              href={`/shop/${seller.handle}?sold=1`}
              className={`btn !px-3.5 !py-2 text-sm ${showSold ? "btn-ink" : "btn-ghost"}`}
            >
              Include sold
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-line bg-paper-dim/60 px-6 py-14 text-center">
            <h3 className="font-display text-lg font-bold tracking-tight">
              Nothing listed yet
            </h3>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-soft">
              This shop is still setting up. Browse the rest of the marketplace meanwhile.
            </p>
            <Link href="/shop" className="btn btn-ink mt-5">
              Shop everything
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:grid-cols-4">
            {items.map((item, i) => (
              <ItemCard key={item.id} item={item} priority={i < 4} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
