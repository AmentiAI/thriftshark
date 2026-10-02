import Link from "next/link";
import { setSellerStatus, toggleSellerFeatured } from "@/lib/actions";
import { ShopAvatar } from "@/components/shop-avatar";
import { shortDate } from "@/lib/format";
import { requireAdmin } from "@/lib/auth";
import { adminListSellers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminSellersPage() {
  await requireAdmin();
  const sellers = await adminListSellers();
  const suspended = sellers.filter((s) => s.status === "suspended").length;

  return (
    <div>
      <header className="mb-7">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Shops</h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          {sellers.length} total · {suspended} suspended. Suspending a shop hides
          it and all of its listings from the storefront immediately; nothing is
          deleted.
        </p>
      </header>

      {sellers.length === 0 ? (
        <p className="panel px-5 py-16 text-center text-sm text-ink-soft">
          No shops have signed up yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {sellers.map((seller) => (
            <li
              key={seller.id}
              className={`flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 ring-1 ${
                seller.status === "suspended" ? "ring-coral/40" : "ring-black/5"
              }`}
            >
              <ShopAvatar
                shopName={seller.shop_name}
                logoImageId={seller.logo_image_id}
                size={48}
              />

              <div className="min-w-56 flex-1">
                <Link
                  href={`/shop/${seller.handle}`}
                  className="font-display font-bold hover:text-reef-dark"
                >
                  {seller.shop_name}
                </Link>
                {seller.status === "suspended" && (
                  <span className="ml-2 rounded-full bg-coral px-2 py-0.5 text-[11px] font-bold text-white uppercase">
                    Suspended
                  </span>
                )}
                {seller.featured && (
                  <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-ink uppercase">
                    Featured
                  </span>
                )}
                <p className="mt-0.5 text-xs text-ink-faint">
                  @{seller.handle} · {seller.email}
                  {seller.cashapp_tag && ` · $${seller.cashapp_tag}`}
                </p>
                <p className="text-xs text-ink-faint">
                  {seller.item_count} listings · {seller.order_count} orders · joined{" "}
                  {shortDate(seller.created_at)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <form action={toggleSellerFeatured}>
                  <input type="hidden" name="id" value={seller.id} />
                  <button className="btn btn-ghost !px-3 !py-2 text-[11px]">
                    {seller.featured ? "Unfeature" : "Feature"}
                  </button>
                </form>
                <form action={setSellerStatus}>
                  <input type="hidden" name="id" value={seller.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={seller.status === "active" ? "suspended" : "active"}
                  />
                  <button
                    className={`btn !px-3 !py-2 text-[11px] ${
                      seller.status === "active"
                        ? "border border-coral text-coral hover:bg-coral hover:text-white"
                        : "btn-ink"
                    }`}
                  >
                    {seller.status === "active" ? "Suspend" : "Reinstate"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
