import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ItemCard } from "@/components/item-card";
import { ShopAvatar } from "@/components/shop-avatar";
import { money, shortDate } from "@/lib/format";
import { getSellerByHandle, searchItems } from "@/lib/queries";
import { cashappUrl } from "@/lib/images";

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
      `${seller.shop_name} on Thrift Shark — ${seller.item_count} one-of-one listings.`,
    openGraph: {
      title: seller.shop_name,
      description: seller.tagline ?? `${seller.item_count} listings on Thrift Shark.`,
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
    <div className="wrap py-10">
      {/* Banner + identity */}
      <header className="overflow-hidden rounded-[2rem] bg-white ring-1 ring-black/5">
        <div className="relative h-40 bg-ink sm:h-56">
          {seller.banner_image_id ? (
            <Image
              src={`/api/images/${seller.banner_image_id}`}
              alt={`${seller.shop_name} banner`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(600px_300px_at_80%_-20%,rgb(0_132_255/0.6),transparent_60%),radial-gradient(400px_240px_at_10%_120%,rgb(62_198_255/0.45),transparent_60%)]" />
          )}
        </div>

        <div className="relative px-5 pb-7 sm:px-10">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-5">
            <div className="flex min-w-0 items-end gap-3 sm:gap-4">
              <div className="rounded-full bg-white p-1.5 ring-1 ring-black/5">
                <ShopAvatar
                  shopName={seller.shop_name}
                  logoImageId={seller.logo_image_id}
                  size={64}
                  className="sm:!h-22 sm:!w-22"
                />
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="font-display text-3xl leading-none font-extrabold tracking-[-0.04em] break-anywhere sm:text-4xl lg:text-5xl">
                  {seller.shop_name}
                </h1>
                <p className="mt-2 text-sm font-semibold text-ink-faint">
                  @{seller.handle}
                  {seller.location && ` · ${seller.location}`}
                  {` · joined ${shortDate(seller.created_at)}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pb-1">
              {seller.cashapp_tag && (
                <a
                  href={cashappUrl(seller.cashapp_tag)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-ghost !px-4 !py-2.5 text-xs"
                >
                  ${seller.cashapp_tag}
                </a>
              )}
              <Link href="/contact" className="btn btn-ink !px-4 !py-2.5 text-xs">
                Message shop
              </Link>
            </div>
          </div>

          {(seller.tagline || seller.bio) && (
            <div className="mt-6 max-w-2xl">
              {seller.tagline && (
                <p className="font-display text-xl font-bold tracking-tight">{seller.tagline}</p>
              )}
              {seller.bio && (
                <p className="mt-2 leading-relaxed whitespace-pre-line text-ink-soft">
                  {seller.bio}
                </p>
              )}
            </div>
          )}

          <dl className="mt-7 flex flex-wrap gap-3">
            {[
              [String(seller.item_count), "for sale"],
              [String(seller.sold_count), "sold"],
              [money(stockValue), "on the rack"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-paper-dim px-4 py-3">
                <dt className="font-display text-xl font-extrabold tracking-tight">{value}</dt>
                <dd className="text-xs font-semibold text-ink-faint">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* Listings */}
      <section className="pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
            {showSold ? "Everything, including sold" : "In the shop"}
          </h2>
          <div className="flex gap-2">
            <Link
              href={`/shop/${seller.handle}`}
              className={`btn !px-4 !py-2 text-xs ${showSold ? "btn-ghost" : "btn-ink"}`}
            >
              For sale
            </Link>
            <Link
              href={`/shop/${seller.handle}?sold=1`}
              className={`btn !px-4 !py-2 text-xs ${showSold ? "btn-ink" : "btn-ghost"}`}
            >
              Include sold
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="panel mt-8 px-6 py-20 text-center">
            <h3 className="font-display text-2xl font-extrabold tracking-tight">
              Nothing listed yet
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
              This shop is still setting up. Check back, or browse the rest of
              the marketplace.
            </p>
            <Link href="/shop" className="btn btn-ink mt-6">
              Shop everything
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-4">
            {items.map((item, i) => (
              <ItemCard key={item.id} item={item} priority={i < 4} />
            ))}
          </div>
        )}
      </section>

      {/* How paying this shop works */}
      {seller.cashapp_tag && (
        <section className="mt-16 grid gap-8 rounded-[2rem] bg-ink p-8 text-paper sm:p-12 lg:grid-cols-[1.4fr_auto] lg:items-center">
          <div>
            <p className="eyebrow-pill">Paying {seller.shop_name}</p>
            <h2 className="mt-5 font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
              Scan, send, done.
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-paper/70">
              Place your order and you will get this shop&apos;s Cash App code
              on the confirmation page. Scan it, send the total, and{" "}
              {seller.shop_name} ships straight to you. Money goes to the
              seller, never through us.
            </p>
            <p className="mt-5 font-display text-2xl font-extrabold text-reef">
              ${seller.cashapp_tag}
            </p>
          </div>

          {seller.qr_image_id && (
            <div className="justify-self-start rounded-[1.6rem] bg-white p-4 lg:justify-self-end">
              <Image
                src={`/api/images/${seller.qr_image_id}`}
                alt={`Cash App code for $${seller.cashapp_tag}`}
                width={176}
                height={176}
                className="h-44 w-44"
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
