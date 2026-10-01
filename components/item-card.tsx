import Image from "next/image";
import Link from "next/link";
import { money } from "@/lib/format";
import { conditionLabel, type Item } from "@/lib/types";

export function ItemCard({ item, priority = false }: { item: Item; priority?: boolean }) {
  const image = item.images?.[0];
  const sold = item.status === "sold";
  const onSale = !!item.compare_at_cents && item.compare_at_cents > item.price_cents;

  return (
    <Link href={`/item/${item.slug}`} className="group block">
      <div className="relative aspect-3/4 overflow-hidden bg-paper-dim">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt ?? item.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className={`object-cover transition duration-500 group-hover:scale-[1.03] ${
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
            <span className="eyebrow bg-ink px-2 py-1 text-paper">Sold</span>
          )}
          {!sold && onSale && (
            <span className="eyebrow bg-coral px-2 py-1 text-white">Marked down</span>
          )}
          {!sold && item.featured && !onSale && (
            <span className="eyebrow bg-reef px-2 py-1 text-ink">Staff pick</span>
          )}
        </div>
      </div>

      <div className="pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-base leading-snug font-semibold group-hover:text-reef-dark">
            {item.title}
          </h3>
          <p className="shrink-0 text-right text-sm font-semibold">
            {money(item.price_cents)}
            {onSale && (
              <span className="ml-1.5 text-xs font-normal text-ink-faint line-through">
                {money(item.compare_at_cents!)}
              </span>
            )}
          </p>
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          {[item.brand, item.item_size && `Size ${item.item_size}`, conditionLabel(item.condition)]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </Link>
  );
}
