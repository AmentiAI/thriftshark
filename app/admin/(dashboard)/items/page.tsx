import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { setItemStatus } from "@/lib/actions";
import { money, shortDate } from "@/lib/format";
import { adminListItems } from "@/lib/queries";
import { conditionLabel, imageSrc, STATUSES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminItemsPage(props: PageProps<"/admin/items">) {
  await requireAdmin();
  const params = await props.searchParams;
  const rawStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = (STATUSES as string[]).includes(rawStatus ?? "") ? rawStatus : undefined;

  const items = await adminListItems(status);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Inventory</h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            {items.length} {items.length === 1 ? "item" : "items"}
            {status ? ` with status “${status}”` : " across every status"}
          </p>
        </div>
        <Link href="/admin/sellers" className="bg-ink px-5 py-3 text-sm font-semibold tracking-wide text-paper uppercase">
          Manage shops
        </Link>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/items"
          className={`border px-3 py-1.5 ${!status ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/items?status=${s}`}
            className={`border px-3 py-1.5 capitalize ${
              status === s ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
            }`}
          >
            {s}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="border border-line bg-paper-dim/40 px-5 py-16 text-center text-sm text-ink-soft">
          Nothing listed yet — listings are created by sellers in their own
          dashboards.
        </p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-4 py-3.5">
              <div className="relative h-20 w-15 shrink-0 bg-paper-dim">
                {imageSrc(item.images[0]) && (
                  <Image
                    src={imageSrc(item.images[0])!}
                    alt=""
                    fill
                    sizes="60px"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="min-w-50 flex-1">
                <Link href={`/item/${item.slug}`} className="font-medium hover:text-reef-dark">
                  {item.title}
                </Link>
                {item.seller_handle && (
                  <Link
                    href={`/shop/${item.seller_handle}`}
                    className="ml-2 text-xs font-semibold text-reef-dark hover:underline"
                  >
                    {item.seller_shop_name}
                  </Link>
                )}
                <p className="mt-0.5 text-xs text-ink-faint">
                  {[
                    item.category_name,
                    item.brand,
                    item.item_size && `Size ${item.item_size}`,
                    conditionLabel(item.condition),
                    shortDate(item.created_at),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              <p className="w-20 text-right text-sm font-semibold">{money(item.price_cents)}</p>

              <form action={setItemStatus} className="flex items-center gap-2">
                <input type="hidden" name="id" value={item.id} />
                <label className="sr-only" htmlFor={`status-${item.id}`}>
                  Status for {item.title}
                </label>
                <select
                  id={`status-${item.id}`}
                  name="status"
                  defaultValue={item.status}
                  className="border border-line bg-paper px-2 py-1.5 text-xs capitalize"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button className="border border-line px-2.5 py-1.5 text-xs font-semibold uppercase hover:border-ink">
                  Set
                </button>
              </form>

              {item.featured && (
                <span className="eyebrow bg-reef px-1.5 py-0.5 text-ink">Pick</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
