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
      <div className="relative aspect-3/4 overflow-hidden rounded-[1.6rem] bg-white shadow-[0_18px_40px_-28px_rgb(0_0_0/0.7)] ring-1 ring-black/5">
        {src ? (
          <Image
            src={src}
            alt={auction.images[0].alt ?? auction.item_title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className={`object-contain p-3 transition duration-700 group-hover:scale-[1.04] ${
              live ? "" : "opacity-60 grayscale"
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-faint">
            No photo
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {live ? (
            <span className="flex items-center gap-1.5 rounded-full bg-coral px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-white uppercase">
              <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full text-white" />
              Live
            </span>
          ) : (
            <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-paper uppercase">
              {auction.status === "sold" ? "Won" : "Unsold"}
            </span>
          )}
          {auction.reserve_cents !== null && live && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold tracking-wide text-ink uppercase">
              {current >= auction.reserve_cents ? "Reserve met" : "Reserve"}
            </span>
          )}
        </div>

        {live && (
          <div className="absolute inset-x-3 bottom-3 rounded-full bg-ink/90 px-4 py-2 text-center text-[11px] font-bold tracking-[0.12em] text-paper uppercase backdrop-blur">
            <Countdown endsAt={auction.ends_at} compact className="text-paper" />
            {" left"}
          </div>
        )}
      </div>

      <div className="px-1 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg leading-snug font-bold tracking-tight group-hover:underline">
            {auction.item_title}
          </h3>
          <p className="shrink-0 text-right">
            <span className="block font-display font-extrabold">{money(current)}</span>
            <span className="block text-[11px] text-ink-faint">
              {auction.bid_count === 0
                ? "no bids yet"
                : `${auction.bid_count} bid${auction.bid_count === 1 ? "" : "s"}`}
            </span>
          </p>
        </div>

        {live && (
          <p className="mt-1 text-xs font-semibold text-ink-soft">
            Next bid {money(minimumBid(auction))}
          </p>
        )}

        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-ink-soft">
          <ShopAvatar
            shopName={auction.seller_shop_name}
            logoImageId={auction.seller_logo_image_id}
            size={18}
          />
          <span className="truncate">{auction.seller_shop_name}</span>
        </p>
      </div>
    </Link>
  );
}
