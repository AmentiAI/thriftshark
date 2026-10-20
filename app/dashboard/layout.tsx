import Link from "next/link";
import { redirect } from "next/navigation";
import { ShopMasthead } from "@/components/shop-masthead";
import { signOutSeller } from "@/lib/actions";
import { currentSeller } from "@/lib/seller-auth";
import { isSellerVerified } from "@/lib/seller-plan";

export const dynamic = "force-dynamic";

const TABS = [
  ["/dashboard", "Overview"],
  ["/dashboard/items", "Listings"],
  ["/dashboard/items/new", "Add listing"],
  ["/dashboard/auctions", "Auctions"],
  ["/dashboard/orders", "Orders"],
  ["/dashboard/messages", "Messages"],
  ["/dashboard/verified", "Verified"],
  ["/dashboard/shop", "Storefront"],
];

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const seller = await currentSeller();
  if (!seller) redirect("/login");

  return (
    <div className="wrap py-6 sm:py-10">
      {/* The seller sees their own banner and picture, so the dashboard shows
          the same thing a buyer sees. */}
      <ShopMasthead
        shopName={seller.shop_name}
        bannerImageId={seller.banner_image_id}
        logoImageId={seller.logo_image_id}
        bannerX={seller.banner_x}
        bannerY={seller.banner_y}
        logoX={seller.logo_x}
        logoY={seller.logo_y}
        verified={isSellerVerified(seller)}
        meta={
          <Link href={`/shop/${seller.handle}`} className="break-anywhere hover:underline">
            thriftsharks.com/shop/{seller.handle}
          </Link>
        }
        actions={
          <>
            <Link href={`/shop/${seller.handle}`} className="btn btn-ghost !px-3.5 !py-2 text-sm">
              View shop
            </Link>
            <form action={signOutSeller} className="contents">
              <button className="btn btn-ghost !px-3.5 !py-2 text-sm">Sign out</button>
            </form>
          </>
        }
      />

      <nav
        className="scroll-x mt-5 flex gap-1 rounded-full border border-line bg-paper-dim p-1"
        aria-label="Dashboard sections"
      >
        {TABS.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="tap flex shrink-0 items-center rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap text-ink-soft transition hover:bg-paper hover:text-ink"
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="pt-7 sm:pt-9">{children}</div>
    </div>
  );
}
