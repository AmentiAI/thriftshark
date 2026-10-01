import { ItemForm } from "@/components/item-form";
import { requireAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <div>
      <header className="mb-8">
        <h2 className="font-display text-2xl font-bold tracking-tight">Add an item</h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          Measurements and flaws in the description — that is what cuts returns.
        </p>
      </header>
      <ItemForm categories={categories} />
    </div>
  );
}
