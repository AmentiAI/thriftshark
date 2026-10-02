import Link from "next/link";
import { redirect } from "next/navigation";
import { ShopAvatar } from "@/components/shop-avatar";
import { signOutSeller } from "@/lib/actions";
import { currentSeller } from "@/lib/seller-auth";

export const dynamic = "force-dynamic";

const TABS = [
  ["/dashboard", "Overview"],
  ["/dashboard/items", "Listings"],
  ["/dashboard/items/new", "Add listing"],
  ["/dashboard/auctions", "Auctions"],
  ["/dashboard/orders", "Orders"],
  ["/dashboard/messages", "Questions"],
  ["/dashboard/shop", "Storefront"],
];

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const seller = await currentSeller();
  if (!seller) redirect("/login");

  return (
    <div className="wrap py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShopAvatar
            shopName={seller.shop_name}
            logoImageId={seller.logo_image_id}
            size={52}
          />
          <div>
            <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight">
              {seller.shop_name}
            </h1>
            <Link
              href={`/shop/${seller.handle}`}
              className="text-xs font-semibold text-ink-faint underline hover:text-reef-dark"
            >
              View storefront · /shop/{seller.handle}
            </Link>
          </div>
        </div>

        <form action={signOutSeller}>
          <button className="btn btn-ghost !px-4 !py-2 text-xs">Sign out</button>
        </form>
      </div>

      <nav
        className="scroll-x mt-7 flex gap-1.5 rounded-full bg-white/80 p-1.5 ring-1 ring-black/5"
        aria-label="Dashboard sections"
      >
        {TABS.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="tap flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap text-ink-soft transition hover:bg-reef/10 hover:text-reef-dark"
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="pt-9">{children}</div>
    </div>
  );
}
