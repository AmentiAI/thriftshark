import { notFound } from "next/navigation";
import { ListingForm } from "@/components/listing-form";
import { requireSeller } from "@/lib/seller-auth";
import { getCategories, getItemById } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditListingPage(props: PageProps<"/dashboard/items/[id]">) {
  const seller = await requireSeller();
  const { id } = await props.params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) notFound();

  const [item, categories] = await Promise.all([getItemById(itemId), getCategories()]);
  // A seller can only ever open their own listing.
  if (!item || item.seller_id !== seller.id) notFound();

  return (
    <div>
      <header className="mb-8">
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em]">
          {item.title}
        </h2>
        <p className="mt-2 font-mono text-xs text-ink-faint">/item/{item.slug}</p>
      </header>
      <ListingForm categories={categories} item={item} />
    </div>
  );
}
