import Image from "next/image";
import Link from "next/link";
import { isFresh, money } from "@/lib/format";
import { conditionLabel, imageSrc, type Item } from "@/lib/types";

export function ItemCard({ item, priority = false }: { item: Item; priority?: boolean }) {
  const image = item.images?.[0];
  const src = imageSrc(image);
  const sold = item.status === "sold";
  const onSale = !!item.compare_at_cents && item.compare_at_cents > item.price_cents;
  const fresh = !sold && isFresh(item.created_at);

  return (
    <Link href={`/item/${item.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-paper-dim">
        {src ? (
          <Image
            src={src}
            alt={image.alt ?? item.title}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 640px) 33vw, 50vw"
            priority={priority}
            className={`object-cover transition duration-400 group-hover:scale-[1.02] ${
              sold ? "opacity-40 grayscale" : ""
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-faint">
            No photo
          </div>
        )}

        {(sold || onSale || fresh) && (
          <div className="absolute top-2 left-2">
            {sold ? (
              <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-white uppercase">
                Sold
              </span>
            ) : onSale ? (
              <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-semibold text-white uppercase">
                Sale
              </span>
            ) : (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-ink uppercase shadow-sm">
                New
              </span>
            )}
          </div>
        )}
      </div>

      <div className="pt-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold tracking-tight">{money(item.price_cents)}</p>
          {onSale && (
            <span className="text-xs text-ink-faint line-through">
              {money(item.compare_at_cents!)}
            </span>
          )}
        </div>
        <h3 className="mt-0.5 line-clamp-2 text-sm leading-snug text-ink-soft group-hover:text-ink">
          {item.title}
        </h3>
        <p className="mt-1 truncate text-xs text-ink-faint">
          {item.seller_handle
            ? `@${item.seller_handle}`
            : [item.brand, item.item_size && `Sz ${item.item_size}`, conditionLabel(item.condition)]
                .filter(Boolean)
                .join(" · ") || "—"}
        </p>
      </div>
    </Link>
  );
}
