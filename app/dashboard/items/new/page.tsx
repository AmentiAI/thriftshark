import { ListingForm } from "@/components/listing-form";
import { requireSeller } from "@/lib/seller-auth";
import { getCategories } from "@/lib/queries";
import {
  VERIFIED_SPOTLIGHT_CAP,
  isSellerVerified,
  listingPhotoLimit,
} from "@/lib/seller-plan";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const seller = await requireSeller();
  const categories = await getCategories();
  const verified = isSellerVerified(seller);

  return (
    <div>
      <header className="mb-8">
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em]">
          Add a listing
        </h2>
        <p className="mt-2 text-ink-soft">
          Photos and measurements do the selling. Put it on the rack for a set
          price
          {verified
            ? ", spotlight it, or send it to the auction house."
            : ". Auction house, sale pricing, and spotlights come with Verified ($20/mo)."}
        </p>
      </header>
      <ListingForm
        categories={categories}
        canAuction={verified}
        maxPhotos={listingPhotoLimit(verified)}
        canSalePrice={verified}
        canSpotlight={verified}
        spotlightCap={VERIFIED_SPOTLIGHT_CAP}
      />
    </div>
  );
}
