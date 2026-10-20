import Image from "next/image";
import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { ShopAvatar } from "@/components/shop-avatar";
import { money } from "@/lib/format";
import { imageSrc, type Auction } from "@/lib/types";
import { minimumBid } from "@/lib/auctions";

export function AuctionCard({ auction, priority = false }: { auction: Auction; priority?: boolean }) {
  const src = imageSrc(auction.images[0]);
  const live = auction.status === "live";
  const current = auction.high_cents ?? auction.start_cents;

  return (
    <Link href={`/auctions/${auction.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-paper-dim">
        {src ? (
          <Image
            src={src}
            alt={auction.images[0].alt ?? auction.item_title}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 640px) 33vw, 50vw"
            priority={priority}
            className={`object-cover transition duration-400 group-hover:scale-[1.02] ${
              live ? "" : "opacity-40 grayscale"
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-faint">
            No photo
          </div>
        )}

        <div className="absolute top-2 left-2">
          {live ? (
            <span className="flex items-center gap-1.5 rounded-full bg-coral px-2 py-0.5 text-[10px] font-semibold text-white uppercase">
              <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full text-white" />
              Live
            </span>
          ) : (
            <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-white uppercase">
              {auction.status === "sold" ? "Won" : "Ended"}
            </span>
          )}
        </div>

        {live && (
          <div className="absolute inset-x-2 bottom-2 rounded-full bg-white/95 px-3 py-1.5 text-center text-[11px] font-semibold text-ink shadow-sm">
            <Countdown endsAt={auction.ends_at} compact className="text-ink" /> left
          </div>
        )}
      </div>

      <div className="pt-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm leading-snug text-ink-soft group-hover:text-ink">
            {auction.item_title}
          </h3>
          <p className="shrink-0 text-right">
            <span className="block text-sm font-semibold">{money(current)}</span>
            <span className="block text-[11px] text-ink-faint">
              {auction.bid_count === 0 ? "no bids" : `${auction.bid_count} bids`}
            </span>
          </p>
        </div>
        {auction.item_size && (
          <p className="mt-1 truncate text-xs text-ink-faint">Size {auction.item_size}</p>
        )}
        {live && (
          <p className="mt-1 text-[11px] text-ink-faint">Next {money(minimumBid(auction))}</p>
        )}
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-faint">
          <ShopAvatar
            shopName={auction.seller_shop_name}
            logoImageId={auction.seller_logo_image_id}
            size={16}
          />
          <span className="truncate">{auction.seller_shop_name}</span>
        </p>
      </div>
    </Link>
  );
}
