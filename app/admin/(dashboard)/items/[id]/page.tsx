import { notFound } from "next/navigation";
import { ItemForm } from "@/components/item-form";
import { requireAdmin } from "@/lib/auth";
import { getCategories, getItemById } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditItemPage(props: PageProps<"/admin/items/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) notFound();

  const [item, categories] = await Promise.all([getItemById(itemId), getCategories()]);
  if (!item) notFound();

  return (
    <div>
      <header className="mb-8">
        <h2 className="font-display text-2xl font-bold tracking-tight">{item.title}</h2>
        <p className="mt-1.5 font-mono text-xs text-ink-faint">/item/{item.slug}</p>
      </header>
      <ItemForm categories={categories} item={item} />
    </div>
  );
}
