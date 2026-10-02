import Link from "next/link";
import { ShopAvatar } from "@/components/shop-avatar";
import type { SellerCard as SellerCardType } from "@/lib/types";

export function SellerCard({ seller }: { seller: SellerCardType }) {
  return (
    <Link
      href={`/shop/${seller.handle}`}
      className="group flex flex-col rounded-[1.6rem] bg-white p-6 ring-1 ring-black/5 transition hover:-translate-y-1"
    >
      <div className="flex items-center gap-3">
        <ShopAvatar shopName={seller.shop_name} logoImageId={seller.logo_image_id} size={56} />
        <div className="min-w-0">
          <h3 className="truncate font-display text-xl leading-tight font-extrabold tracking-tight group-hover:text-reef-dark">
            {seller.shop_name}
          </h3>
          <p className="truncate text-xs text-ink-faint">
            @{seller.handle}
            {seller.location && ` · ${seller.location}`}
          </p>
        </div>
      </div>

      {seller.tagline && (
        <p className="mt-4 line-clamp-2 text-sm leading-snug text-ink-soft">{seller.tagline}</p>
      )}

      <div className="mt-auto flex items-center gap-2 pt-5">
        <span className="rounded-full bg-paper-dim px-3 py-1 text-xs font-bold">
          {seller.item_count} {seller.item_count === 1 ? "listing" : "listings"}
        </span>
        {seller.sold_count > 0 && (
          <span className="rounded-full bg-paper-dim px-3 py-1 text-xs font-bold">
            {seller.sold_count} sold
          </span>
        )}
        {seller.featured && (
          <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-ink">Featured</span>
        )}
      </div>
    </Link>
  );
}
