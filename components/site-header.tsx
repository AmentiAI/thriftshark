import { SiteNav } from "@/components/site-nav";
import { currentSeller } from "@/lib/seller-auth";
import { getCategories } from "@/lib/queries";

export async function SiteHeader() {
  const [categories, seller] = await Promise.all([getCategories(), currentSeller()]);

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
    />
  );
}
