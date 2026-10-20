import Link from "next/link";
import {
  setSellerStatus,
  toggleSellerFeatured,
  toggleSellerOfficial,
} from "@/lib/actions";
import { ShopAvatar } from "@/components/shop-avatar";
import { VerifiedBadge } from "@/components/verified-badge";
import { shortDate } from "@/lib/format";
import { requireAdmin } from "@/lib/auth";
import { adminListSellers } from "@/lib/queries";
import { isSellerVerified } from "@/lib/seller-plan";

export const dynamic = "force-dynamic";

export default async function AdminSellersPage() {
  await requireAdmin();
  const sellers = await adminListSellers();
  const suspended = sellers.filter((s) => s.status === "suspended").length;
  const verifiedCount = sellers.filter((s) => isSellerVerified(s)).length;

  return (
    <div>
      <header className="mb-7">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Shops</h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          {sellers.length} total · {verifiedCount} verified · {suspended} suspended.
          Grant Verified to give a shop the paid perks without a 30-day pass.
          Suspending hides the shop and its listings immediately.
        </p>
      </header>

      {sellers.length === 0 ? (
        <p className="panel px-5 py-16 text-center text-sm text-ink-soft">
          No shops have signed up yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {sellers.map((seller) => {
            const verified = isSellerVerified(seller);
            const paid =
              !seller.official &&
              Boolean(seller.verified_until) &&
              new Date(seller.verified_until!).getTime() > Date.now();

            return (
              <li
                key={seller.id}
                className={`flex flex-wrap items-center gap-3 rounded-2xl bg-paper-dim p-3 sm:gap-4 sm:p-4 ring-1 ${
                  seller.status === "suspended" ? "ring-coral/40" : "ring-white/10"
                }`}
              >
                <ShopAvatar
                  shopName={seller.shop_name}
                  logoImageId={seller.logo_image_id}
                  size={48}
                />

                <div className="min-w-0 flex-1 basis-full break-anywhere sm:basis-auto">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/shop/${seller.handle}`}
                      className="font-display font-bold hover:text-reef-dark"
                    >
                      {seller.shop_name}
                    </Link>
                    {verified && <VerifiedBadge size="sm" />}
                    {seller.status === "suspended" && (
                      <span className="rounded-full bg-coral px-2 py-0.5 text-[11px] font-bold text-white uppercase">
                        Suspended
                      </span>
                    )}
                    {seller.featured && (
                      <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-ink uppercase">
                        Featured
                      </span>
                    )}
                    {seller.official && (
                      <span className="rounded-full bg-reef/20 px-2 py-0.5 text-[11px] font-bold text-ink uppercase">
                        Admin verified
                      </span>
                    )}
                    {paid && !seller.official && (
                      <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] font-bold text-ink-soft uppercase ring-1 ring-line">
                        Paid pass
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    @{seller.handle} · {seller.email}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {seller.item_count} listings · {seller.order_count} orders · joined{" "}
                    {shortDate(seller.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <form action={toggleSellerOfficial}>
                    <input type="hidden" name="id" value={seller.id} />
                    <button
                      className={`btn !px-3 !py-2 text-[11px] ${
                        seller.official ? "btn-ghost" : "btn-ink"
                      }`}
                    >
                      {seller.official ? "Revoke verified" : "Grant verified"}
                    </button>
                  </form>
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
            );
          })}
        </ul>
      )}
    </div>
  );
}
