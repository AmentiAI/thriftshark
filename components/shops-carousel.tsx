import Link from "next/link";
import Image from "next/image";
import { ShopAvatar } from "@/components/shop-avatar";
import { Marquee } from "@/components/motion/marquee";
import { VerifiedBadge } from "@/components/verified-badge";
import { focalStyle, type SellerCard } from "@/lib/types";

/** Seamless shop rail — continuous loop, never pauses or jumps. */
export function ShopsCarousel({ sellers }: { sellers: SellerCard[] }) {
  if (sellers.length === 0) return null;

  // Enough tiles that one half of the track is wider than a typical viewport.
  const minItems = Math.max(16, sellers.length * 4);

  return (
    <Marquee
      speed={55}
      gap="gap-3 sm:gap-4"
      minItems={minItems}
      pauseOnHover={false}
    >
      {sellers.map((seller) => (
        <Link
          key={seller.id}
          href={`/shop/${seller.handle}`}
          className="group flex w-[13.5rem] shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-paper transition hover:border-ink sm:w-[15.5rem]"
        >
          <div className="relative h-16 sm:h-20">
            {seller.banner_image_id ? (
              <Image
                src={`/api/images/${seller.banner_image_id}`}
                alt=""
                fill
                sizes="248px"
                className="object-cover"
                style={focalStyle(seller.banner_x, seller.banner_y)}
              />
            ) : (
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-br from-zinc-200 via-paper-dim to-zinc-100"
              />
            )}
          </div>
          <div className="flex items-center gap-2.5 px-3 pt-0 pb-3">
            <div className="relative z-10 -mt-5 rounded-full bg-paper p-0.5 ring-1 ring-line">
              <ShopAvatar
                shopName={seller.shop_name}
                logoImageId={seller.logo_image_id}
                size={40}
                focalX={seller.logo_x}
                focalY={seller.logo_y}
              />
            </div>
            <div className="min-w-0 pt-2">
              <span className="flex items-center gap-1 truncate font-display text-sm font-bold tracking-tight group-hover:underline">
                <span className="min-w-0 truncate">{seller.shop_name}</span>
                {seller.verified && <VerifiedBadge size="sm" />}
              </span>
              <span className="block truncate text-xs text-ink-faint">
                @{seller.handle}
                {seller.identity_checked ? " · ID checked" : ""}
                {seller.item_count > 0
                  ? ` · ${seller.item_count} ${seller.item_count === 1 ? "listing" : "listings"}`
                  : ""}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </Marquee>
  );
}
