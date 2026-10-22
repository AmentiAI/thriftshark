import type { Metadata } from "next";
import { OfferList } from "@/components/offer-list";
import { pendingOffersForSeller } from "@/lib/queries";
import { requireSeller } from "@/lib/seller-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Offers" };

export default async function OffersPage() {
  const seller = await requireSeller();
  const offers = await pendingOffersForSeller(seller.id);

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl font-extrabold tracking-tight">Offers</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Accepting an offer changes that listing to their price. It is still a single
        item, so whoever checks out first gets it. Offers close after 48 hours.
      </p>
      <div className="mt-6">
        <OfferList offers={offers} />
      </div>
    </div>
  );
}
