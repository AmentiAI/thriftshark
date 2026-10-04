import Image from "next/image";
import Link from "next/link";
import { ShopAvatar } from "@/components/shop-avatar";
import type { SellerCard as SellerCardType } from "@/lib/types";

export function SellerCard({
  seller,
  priority = false,
}: {
  seller: SellerCardType;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/shop/${seller.handle}`}
      className="group flex flex-col overflow-hidden rounded-[1.6rem] bg-white ring-1 ring-black/5 transition hover:-translate-y-1 hover:ring-ink"
    >
      {/* The shop's own banner, so the directory looks like the shops do. */}
      <div className="relative h-28 sm:h-32">
        {seller.banner_image_id ? (
          <Image
            src={`/api/images/${seller.banner_image_id}`}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-ink">
            <div className="absolute inset-0 bg-[radial-gradient(260px_140px_at_80%_-10%,rgb(0_132_255/0.7),transparent_60%),radial-gradient(200px_120px_at_5%_120%,rgb(62_198_255/0.55),transparent_60%)]" />
            <div className="hatch absolute inset-0" />
          </div>
        )}
        {seller.featured && (
          <span className="absolute top-3 right-3 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-ink uppercase">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5">
        <div className="-mt-9 flex items-end gap-3">
          <div className="rounded-full bg-white p-1 shadow-lg ring-1 ring-black/5">
            <ShopAvatar
              shopName={seller.shop_name}
              logoImageId={seller.logo_image_id}
              size={64}
            />
          </div>
        </div>

        <h3 className="mt-3 font-display text-xl leading-tight font-extrabold tracking-tight break-anywhere group-hover:text-reef-dark">
          {seller.shop_name}
        </h3>
        <p className="mt-1 truncate text-xs font-semibold text-ink-faint">
          @{seller.handle}
          {seller.location && ` · ${seller.location}`}
        </p>

        {seller.tagline && (
          <p className="mt-3 line-clamp-2 text-sm leading-snug text-ink-soft">
            {seller.tagline}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
          <span className="rounded-full bg-paper-dim px-3 py-1 text-xs font-bold">
            {seller.item_count} {seller.item_count === 1 ? "listing" : "listings"}
          </span>
          {seller.sold_count > 0 && (
            <span className="rounded-full bg-paper-dim px-3 py-1 text-xs font-bold">
              {seller.sold_count} sold
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
