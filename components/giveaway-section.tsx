import { GiveawayCard } from "@/components/giveaway-card";
import { currentBuyer, isBuyerVerified } from "@/lib/buyer-account";
import { ensureCurrentGiveaway, sellerEnteredGiveaway } from "@/lib/giveaways";
import { currentSeller } from "@/lib/seller-auth";

/** Loads this week's giveaway for whoever is looking and renders the card. */
export async function GiveawaySection({ className = "" }: { className?: string }) {
  const [giveaway, seller, buyer] = await Promise.all([
    ensureCurrentGiveaway(),
    currentSeller(),
    currentBuyer(),
  ]);
  const buyerVerified = Boolean(buyer && isBuyerVerified(buyer));
  const alreadyEntered = seller ? await sellerEnteredGiveaway(giveaway.id, seller.id) : buyerVerified;

  return (
    <section className={className} aria-label="Weekly giveaway">
      <GiveawayCard
        giveaway={giveaway}
        alreadyEntered={alreadyEntered}
        account={seller ? "shop" : buyer ? "buyer" : "guest"}
        buyerVerified={buyerVerified}
      />
    </section>
  );
}
