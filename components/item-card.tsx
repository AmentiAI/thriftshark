import Image from "next/image";
import Link from "next/link";
import { ShopAvatar } from "@/components/shop-avatar";
import { money } from "@/lib/format";
import { conditionLabel, imageSrc, type Item } from "@/lib/types";

export function ItemCard({ item, priority = false }: { item: Item; priority?: boolean }) {
  const image = item.images?.[0];
  const src = imageSrc(image);
  const sold = item.status === "sold";
  const onSale = !!item.compare_at_cents && item.compare_at_cents > item.price_cents;

  return (
    <Link href={`/item/${item.slug}`} className="group block">
      <div className="relative aspect-3/4 overflow-hidden rounded-[1.6rem] bg-white shadow-[0_18px_40px_-28px_rgb(0_0_0/0.7)] ring-1 ring-black/5">
        {src ? (
          <Image
            src={src}
            alt={image.alt ?? item.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className={`object-contain p-3 transition duration-700 group-hover:scale-[1.04] ${
              sold ? "opacity-55 grayscale" : ""
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-faint">
            No photo yet
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {sold && (
            <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-paper uppercase">
              Sold
            </span>
          )}
          {!sold && onSale && (
            <span className="rounded-full bg-coral px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-white uppercase">
              Marked down
            </span>
          )}
          {!sold && item.featured && !onSale && (
            <span className="rounded-full bg-reef px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-white uppercase">
              Staff pick
            </span>
          )}
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-2 rounded-full bg-ink/90 px-4 py-2 text-center text-[11px] font-bold tracking-[0.16em] text-paper uppercase opacity-0 backdrop-blur transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        >
          View piece
        </div>
      </div>

      <div className="px-1 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg leading-snug font-bold tracking-tight group-hover:underline">
            {item.title}
          </h3>
          <p className="shrink-0 text-right text-sm font-bold">
            {money(item.price_cents)}
            {onSale && (
              <span className="mt-0.5 block text-xs font-medium text-ink-faint line-through">
                {money(item.compare_at_cents!)}
              </span>
            )}
          </p>
        </div>
        <p className="mt-1.5 text-xs font-medium tracking-wide text-ink-faint uppercase">
          {[item.brand, item.item_size && `Size ${item.item_size}`, conditionLabel(item.condition)]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {item.seller_handle && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-ink-soft">
            <ShopAvatar
              shopName={item.seller_shop_name ?? item.seller_handle}
              logoImageId={item.seller_logo_image_id}
              size={18}
            />
            <span className="truncate">{item.seller_shop_name ?? `@${item.seller_handle}`}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
