import Link from "next/link";
import { ShopAvatar } from "@/components/shop-avatar";
import { Marquee } from "@/components/motion/marquee";
import type { SellerCard } from "@/lib/types";

/** A slow-scrolling rail of shop logos, each one a link into that storefront. */
export function ShopRail({ sellers }: { sellers: SellerCard[] }) {
  if (sellers.length === 0) return null;

  return (
    <Marquee speed={58} reverse gap="gap-3">
      {sellers.map((seller) => (
        <Link
          key={seller.id}
          href={`/shop/${seller.handle}`}
          className="group flex shrink-0 items-center gap-3 rounded-full bg-white py-2 pr-6 pl-2 ring-1 ring-black/5 transition hover:-translate-y-1 hover:ring-ink"
        >
          <ShopAvatar
            shopName={seller.shop_name}
            logoImageId={seller.logo_image_id}
            size={40}
          />
          <span>
            <span className="block font-display leading-tight font-extrabold tracking-tight whitespace-nowrap">
              {seller.shop_name}
            </span>
            <span className="block text-xs whitespace-nowrap text-ink-faint">
              {seller.item_count} listings
            </span>
          </span>
        </Link>
      ))}
    </Marquee>
  );
}
