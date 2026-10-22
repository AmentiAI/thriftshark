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
        Confirming an offer changes that listing to their price. The piece stays one of one,
        so the next person to check out gets it. Offers close after 48 hours.
      </p>
      <div className="mt-6">
        <OfferList offers={offers} />
      </div>
    </div>
  );
}
