import Link from "next/link";
import { ShopAvatar } from "@/components/shop-avatar";
import { Marquee } from "@/components/motion/marquee";
import { money } from "@/lib/format";
import { imageSrc, type Item } from "@/lib/types";
import Image from "next/image";

/** The "just listed" ticker: real listings, scrolling, pausing on hover. */
export function LiveDrop({ items }: { items: Item[] }) {
  if (items.length === 0) return null;

  return (
    <Marquee speed={54} className="py-1">
      {items.map((item) => {
        const src = imageSrc(item.images[0]);
        return (
          <Link
            key={item.id}
            href={`/item/${item.slug}`}
            className="group flex w-72 shrink-0 items-center gap-3 rounded-2xl bg-white/8 p-3 ring-1 ring-white/10 transition hover:bg-white/15"
          >
            <div className="relative h-16 w-13 shrink-0 overflow-hidden rounded-xl bg-white">
              {src && (
                <Image src={src} alt="" fill sizes="52px" className="object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{item.title}</p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-paper/60">
                {item.seller_shop_name && (
                  <ShopAvatar
                    shopName={item.seller_shop_name}
                    logoImageId={item.seller_logo_image_id}
                    size={16}
                  />
                )}
                <span className="truncate">{item.seller_shop_name}</span>
              </p>
            </div>
            <p className="shrink-0 font-display text-sm font-extrabold text-reef">
              {money(item.price_cents)}
            </p>
          </Link>
        );
      })}
    </Marquee>
  );
}
