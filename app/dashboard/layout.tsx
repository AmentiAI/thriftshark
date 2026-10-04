import Image from "next/image";
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
    <div className="wrap py-6 sm:py-10">
      {/* The seller sees their own banner and picture, so the dashboard shows
          the same thing a buyer sees. */}
      <header className="overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-black/5">
        <div className="relative h-24 sm:h-32">
          {seller.banner_image_id ? (
            <Image
              src={`/api/images/${seller.banner_image_id}`}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-ink">
              <div className="absolute inset-0 bg-[radial-gradient(400px_200px_at_85%_-20%,rgb(0_132_255/0.65),transparent_60%)]" />
              <div className="hatch absolute inset-0" />
            </div>
          )}
        </div>

        <div className="px-4 pb-4 sm:px-6 sm:pb-5">
          <div className="-mt-9 flex flex-col sm:flex-row sm:items-end sm:gap-4">
            <div className="w-fit rounded-full bg-white p-1 shadow-lg ring-1 ring-black/5">
              <ShopAvatar
                shopName={seller.shop_name}
                logoImageId={seller.logo_image_id}
                size={72}
                className="sm:!h-20 sm:!w-20"
              />
            </div>

            <div className="mt-2 min-w-0 flex-1 sm:mt-0 sm:pb-1">
              <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight break-anywhere sm:text-3xl">
                {seller.shop_name}
              </h1>
              <Link
                href={`/shop/${seller.handle}`}
                className="text-xs font-semibold text-ink-faint underline hover:text-reef-dark"
              >
                /shop/{seller.handle}
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-0 sm:flex sm:pb-1">
              <Link
                href={`/shop/${seller.handle}`}
                className="btn btn-ghost !px-4 !py-3 text-xs sm:!py-2.5"
              >
                View shop
              </Link>
              <form action={signOutSeller} className="contents">
                <button className="btn btn-ghost !px-4 !py-3 text-xs sm:!py-2.5">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <nav
        className="scroll-x mt-5 flex gap-1.5 rounded-full bg-white/80 p-1.5 ring-1 ring-black/5"
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

      <div className="pt-7 sm:pt-9">{children}</div>
    </div>
  );
}
