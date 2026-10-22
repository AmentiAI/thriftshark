import Image from "next/image";
import Link from "next/link";
import { ShopAvatar } from "@/components/shop-avatar";
import { ViewerCount } from "@/components/viewer-count";
import { money } from "@/lib/format";
import type { LiveShow } from "@/lib/live-shows";

/** A live show on the homepage or the live list. The picture is the one the host set. */
export function LiveCard({ show }: { show: LiveShow }) {
  const lot = show.lots.find((item) => item.auction_id === show.current_auction_id);

  return (
    <li>
      <Link href={`/live/${show.id}`} className="panel block overflow-hidden hover:border-ink">
        <div className="relative aspect-[16/10] bg-ink">
          {show.cover_image_id ? (
            <Image
              src={`/api/images/${show.cover_image_id}`}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-ink" />
          )}
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-coral px-2.5 py-1 text-[11px] font-bold tracking-[0.14em] text-white uppercase">
            <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full text-white" />
            Live
          </span>
          {show.viewer_count !== undefined && (
            <span className="absolute top-3 right-3">
              <ViewerCount count={show.viewer_count} />
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-display text-xl font-extrabold tracking-tight break-anywhere">{show.title}</h3>
          <p className="mt-2 inline-flex min-w-0 items-center gap-2 text-sm">
            <ShopAvatar shopName={show.seller_shop_name} logoImageId={show.seller_logo_image_id} size={28} />
            <span className="min-w-0 break-anywhere">{show.seller_shop_name}</span>
          </p>
          <p className="mt-3 text-sm text-ink-soft">
            {lot
              ? `On stage: ${lot.title} · ${money(lot.high_cents ?? lot.start_cents)}`
              : "On camera. Bidding opens when they show the next item."}
          </p>
        </div>
      </Link>
    </li>
  );
}
