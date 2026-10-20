import { SiteNav } from "@/components/site-nav";
import { currentBuyer, isBuyerVerified } from "@/lib/buyer-account";
import { ensureCurrentGiveaway, sellerEnteredGiveaway } from "@/lib/giveaways";
import { currentSeller } from "@/lib/seller-auth";
import { getCategories } from "@/lib/queries";
import { remindExpiringVerified } from "@/lib/verified-pass";

export async function SiteHeader() {
  const [categories, seller, buyer, giveaway] = await Promise.all([
    getCategories(),
    currentSeller(),
    currentBuyer(),
    ensureCurrentGiveaway(),
    remindExpiringVerified().catch((err) => {
      console.error("verified reminder failed", err);
    }),
  ]);

  const alreadyEntered = seller
    ? await sellerEnteredGiveaway(giveaway.id, seller.id)
    : Boolean(buyer && isBuyerVerified(buyer));

  return (
    <SiteNav
      categories={categories.map((category) => ({ slug: category.slug, name: category.name }))}
      seller={
        seller
          ? {
              shop_name: seller.shop_name,
              handle: seller.handle,
              logo_image_id: seller.logo_image_id,
            }
          : null
      }
      buyer={
        seller || !buyer
          ? null
          : { name: buyer.name, verified: isBuyerVerified(buyer) }
      }
      giveaway={{
        giveaway,
        alreadyEntered,
        account: seller ? "shop" : buyer ? "buyer" : "guest",
        buyerVerified: Boolean(buyer && isBuyerVerified(buyer)),
      }}
    />
  );
}
