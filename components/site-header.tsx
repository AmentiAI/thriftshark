import { SiteNav } from "@/components/site-nav";
import { currentBuyer, isBuyerVerified } from "@/lib/buyer-account";
import { currentSeller } from "@/lib/seller-auth";
import { getCategories, sellerBell } from "@/lib/queries";
import { remindExpiringVerified } from "@/lib/verified-pass";

export async function SiteHeader() {
  const [categories, seller, buyer] = await Promise.all([
    getCategories(),
    currentSeller(),
    currentBuyer(),
    remindExpiringVerified().catch((err) => {
      console.error("verified reminder failed", err);
    }),
  ]);

  const bell = seller ? await sellerBell(seller.id) : null;

  return (
    <SiteNav
      categories={categories.map((category) => ({ slug: category.slug, name: category.name }))}
      seller={
        seller
          ? {
              shop_name: seller.shop_name,
              handle: seller.handle,
              logo_image_id: seller.logo_image_id,
              alerts: (bell?.unread ?? 0) + (bell?.waiting ?? 0),
              unread: bell?.unread ?? 0,
              waiting: bell?.waiting ?? 0,
              notices: bell?.notices ?? [],
            }
          : null
      }
      buyer={
        seller || !buyer
          ? null
          : { name: buyer.name, verified: isBuyerVerified(buyer) }
      }
    />
  );
}
