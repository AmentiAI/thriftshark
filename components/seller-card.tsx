import Image from "next/image";
import Link from "next/link";
import { ShopAvatar } from "@/components/shop-avatar";
import { Stars } from "@/components/stars";
import { VerifiedBadge } from "@/components/verified-badge";
import { focalStyle, type SellerCard as SellerCardType } from "@/lib/types";

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
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-paper transition hover:border-ink"
    >
      <div className="relative h-28 sm:h-32">
        {seller.banner_image_id ? (
          <Image
            src={`/api/images/${seller.banner_image_id}`}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            style={focalStyle(seller.banner_x, seller.banner_y)}
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-zinc-200 via-paper-dim to-zinc-100"
          />
        )}
        {seller.featured && (
          <span className="absolute top-2 right-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-ink uppercase shadow-sm">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4">
        <div className="relative z-10 -mt-7 w-fit rounded-full bg-paper p-1 ring-1 ring-line">
          <ShopAvatar
            shopName={seller.shop_name}
            logoImageId={seller.logo_image_id}
            size={56}
            focalX={seller.logo_x}
            focalY={seller.logo_y}
          />
        </div>

        <h3 className="mt-3 flex items-center gap-1.5 font-display text-lg font-bold tracking-tight group-hover:underline">
          <span className="min-w-0 truncate">{seller.shop_name}</span>
          {seller.verified && <VerifiedBadge size="sm" />}
        </h3>
        <p className="mt-0.5 truncate text-xs text-ink-faint">
          @{seller.handle}
          {seller.location && ` · ${seller.location}`}
        </p>

        {seller.tagline && (
          <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{seller.tagline}</p>
        )}

        <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-3 text-xs text-ink-faint">
          <span>
            {seller.item_count} {seller.item_count === 1 ? "listing" : "listings"}
          </span>
          {seller.sold_count > 0 && <span>{seller.sold_count} sold</span>}
          {seller.review_count > 0 && seller.review_avg != null && (
            <span className="inline-flex items-center gap-1">
              <Stars rating={Number(seller.review_avg)} />
              {Number(seller.review_avg).toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
