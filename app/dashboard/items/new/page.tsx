import { ListingForm } from "@/components/listing-form";
import { requireSeller } from "@/lib/seller-auth";
import { getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  await requireSeller();
  const categories = await getCategories();

  return (
    <div>
      <header className="mb-8">
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em]">
          Add a listing
        </h2>
        <p className="mt-2 text-ink-soft">
          Photos and measurements do the selling. Put it on the rack for a set
          price, or send it straight to the auction house.
        </p>
      </header>
      <ListingForm categories={categories} />
    </div>
  );
}
