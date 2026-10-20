import Link from "next/link";
import { ShopAvatar } from "@/components/shop-avatar";
import type { WeeklyTopShop } from "@/lib/types";

/** Ranked shops by paid sales in the current calendar week (Mon–Sun UTC). */
export function TopShopsWidget({
  shops,
  weekStart,
}: {
  shops: WeeklyTopShop[];
  weekStart: string;
}) {
  const weekLabel = formatWeekLabel(weekStart);

  return (
    <div className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-bold tracking-tight sm:text-xl">
          Top shops
        </h3>
        <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
          Weekly
        </p>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        Most paid sales · {weekLabel}. Resets each Monday.
      </p>

      {shops.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">
          No paid sales yet this week — check back as orders come in.
        </p>
      ) : (
        <ol className="mt-5 divide-y divide-line">
          {shops.map((shop, i) => (
            <li key={shop.id}>
              <Link
                href={`/shop/${shop.handle}`}
                className="tap flex items-center gap-3 py-3 transition hover:bg-paper-dim/60"
              >
                <span className="w-5 shrink-0 text-center font-display text-sm font-bold text-ink-faint tabular-nums">
                  {i + 1}
                </span>
                <ShopAvatar
                  shopName={shop.shop_name}
                  logoImageId={shop.logo_image_id}
                  size={40}
                  focalX={shop.logo_x}
                  focalY={shop.logo_y}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-sm font-bold tracking-tight">
                    {shop.shop_name}
                  </span>
                  <span className="block truncate text-xs text-ink-faint">
                    @{shop.handle}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs text-ink-soft tabular-nums">
                  {shop.sales_count}{" "}
                  {shop.sales_count === 1 ? "sale" : "sales"}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function formatWeekLabel(weekStartIso: string) {
  const start = new Date(weekStartIso);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}
