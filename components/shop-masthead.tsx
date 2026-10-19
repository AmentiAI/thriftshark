import Image from "next/image";
import { ShopAvatar } from "@/components/shop-avatar";
import { focalStyle } from "@/lib/types";

/**
 * Shop banner + identity. Shared by the public storefront and seller dashboard
 * so photo, name, and actions land in the same places (X-style overlap).
 */
export function ShopMasthead({
  shopName,
  bannerImageId,
  logoImageId,
  bannerX = 50,
  bannerY = 50,
  logoX = 50,
  logoY = 50,
  meta,
  actions,
  children,
}: {
  shopName: string;
  bannerImageId: number | null;
  logoImageId: number | null;
  bannerX?: number;
  bannerY?: number;
  logoX?: number;
  logoY?: number;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="overflow-hidden rounded-2xl border border-line bg-paper">
      {/* Banner only — clip here so the avatar can hang over the edge. */}
      <div
        className={`relative overflow-hidden ${
          bannerImageId ? "h-36 sm:h-44 lg:h-52" : "h-32 bg-[#e8eaee] sm:h-36"
        }`}
      >
        {bannerImageId ? (
          <Image
            src={`/api/images/${bannerImageId}`}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 72rem, 100vw"
            className="object-cover"
            style={focalStyle(bannerX, bannerY)}
          />
        ) : null}
      </div>

      <div className="px-4 pb-6 sm:px-6 lg:px-8">
        {/* Avatar overlaps banner; actions sit on the right of that row. */}
        <div className="flex items-end justify-between gap-3">
          <div className="relative z-10 -mt-12 shrink-0 rounded-full bg-paper p-1 ring-1 ring-line sm:-mt-14">
            <ShopAvatar
              shopName={shopName}
              logoImageId={logoImageId}
              size={96}
              focalX={logoX}
              focalY={logoY}
            />
          </div>
          {actions && (
            <div className="mb-1 flex min-w-0 flex-wrap justify-end gap-2">{actions}</div>
          )}
        </div>

        {/* Name always below the avatar — never beside it. */}
        <div className="mt-3 min-w-0">
          <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight break-anywhere sm:text-3xl">
            {shopName}
          </h1>
          {meta && (
            <div className="mt-1.5 space-y-0.5 text-sm text-ink-faint">{meta}</div>
          )}
        </div>

        {children}
      </div>
    </header>
  );
}
