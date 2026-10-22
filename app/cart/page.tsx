import type { Metadata } from "next";
import { BagView } from "@/components/bag-view";
import { currentBuyer, isBuyerVerified } from "@/lib/buyer-account";
import { currentSeller } from "@/lib/seller-auth";
import { isSellerVerified } from "@/lib/seller-plan";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your bag",
  description: "Review the items in your bag before checking out.",
};

export default async function CartPage() {
  const [shopper, seller] = await Promise.all([currentBuyer(), currentSeller()]);
  const buyerVerified = Boolean(
    (shopper && isBuyerVerified(shopper)) || (seller && isSellerVerified(seller)),
  );

  return (
    <div className="wrap py-12">
      <header className="pb-2">
        <p className="eyebrow-pill">Step 1 of 2</p>
        <h1 className="mt-5 font-display text-5xl font-extrabold tracking-[-0.05em]">Your bag</h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Nothing is held for you until you check out. Most listings are the
          only one, so whoever pays first gets it.
        </p>
      </header>
      <div className="pt-10">
        <BagView buyerVerified={buyerVerified} />
      </div>
    </div>
  );
}
