import Image from "next/image";
import Link from "next/link";
import { setListingStatus } from "@/lib/actions";
import { money, shortDate } from "@/lib/format";
import { requireSeller } from "@/lib/seller-auth";
import { sellerItems } from "@/lib/queries";
import { conditionLabel, imageSrc, SELLER_SETTABLE_STATUSES, STATUSES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardItemsPage(props: PageProps<"/dashboard/items">) {
  const seller = await requireSeller();
  const params = await props.searchParams;
  const rawStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = (STATUSES as string[]).includes(rawStatus ?? "") ? rawStatus : undefined;

  const items = await sellerItems(seller.id, status);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em]">
            Your listings
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            {items.length} {items.length === 1 ? "listing" : "listings"}
            {status ? ` marked “${status}”` : ""}
          </p>
        </div>
        <Link href="/dashboard/items/new" className="btn btn-lime">
          Add listing
        </Link>
      </header>

      <nav className="mb-7 flex flex-wrap gap-2">
        <Link
          href="/dashboard/items"
          className={`btn !px-4 !py-2 text-xs ${status ? "btn-ghost" : "btn-ink"}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/dashboard/items?status=${s}`}
            className={`btn !px-4 !py-2 text-xs capitalize ${status === s ? "btn-ink" : "btn-ghost"}`}
          >
            {s}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <div className="panel px-6 py-20 text-center">
          <h3 className="font-display text-2xl font-extrabold tracking-tight">
            Nothing here yet
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
            Your rack is empty. Photos, a price and a size is all a listing
            needs.
          </p>
          <Link href="/dashboard/items/new" className="btn btn-lime mt-6">
            Add your first listing
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const src = imageSrc(item.images[0]);
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-3 ring-1 ring-black/5"
              >
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-paper-dim">
                  {src && (
                    <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                  )}
                </div>

                <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                  <Link
                    href={`/dashboard/items/${item.id}`}
                    className="font-display font-bold hover:text-reef-dark"
                  >
                    {item.title}
                  </Link>
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

                <p className="w-20 text-right font-display font-extrabold">
                  {money(item.price_cents)}
                </p>

                {item.status === "auction" ? (
                  <Link
                    href="/dashboard/auctions"
                    className="rounded-full bg-coral px-3 py-1.5 text-[11px] font-bold text-white uppercase"
                  >
                    On the block
                  </Link>
                ) : (
                  <form action={setListingStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={item.id} />
                    <label className="sr-only" htmlFor={`status-${item.id}`}>
                      Status for {item.title}
                    </label>
                    <select
                      id={`status-${item.id}`}
                      name="status"
                      defaultValue={item.status}
                      className="field !w-auto !py-2 capitalize sm:text-xs"
                    >
                      {SELLER_SETTABLE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-ghost !px-3 !py-2 text-[11px]">Set</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
