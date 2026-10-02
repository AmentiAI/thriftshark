import Link from "next/link";
import type { Metadata } from "next";
import { ItemCard } from "@/components/item-card";
import { ShopFilters } from "@/components/shop-filters";
import { getCategories, getCategoryCounts, getFilterFacets, searchItems } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop everything",
  description:
    "Every piece currently in the shop: jackets, denim, tops, dresses, shoes, accessories and home oddities. One of each.",
};

const first = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

export default async function ShopPage(props: PageProps<"/shop">) {
  const params = await props.searchParams;

  const query = {
    category: first(params.category),
    q: first(params.q),
    condition: first(params.condition),
    size: first(params.size),
    brand: first(params.brand),
    sort: first(params.sort),
    includeSold: first(params.includeSold) === "1",
    page: Number(first(params.page)) || 1,
    perPage: 12,
  };

  const [result, categories, counts, facets] = await Promise.all([
    searchItems(query),
    getCategories(),
    getCategoryCounts(),
    getFilterFacets(),
  ]);

  const totalInStock = Object.values(counts).reduce((a, b) => a + b, 0);
  const activeCategory = categories.find((c) => c.slug === query.category);

  const pageHref = (page: number) => {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (key === "page" || key === "perPage" || !value) continue;
      sp.set(key, value === true ? "1" : String(value));
    }
    if (page > 1) sp.set("page", String(page));
    const qs = sp.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  return (
    <div className="wrap py-12">
      <header className="pb-8">
        <p className="eyebrow-pill">
          {query.includeSold ? "Shop + sold archive" : "In stock now"}
        </p>
        <h1 className="mt-5 font-display text-5xl font-extrabold tracking-[-0.05em] sm:text-6xl">
          {activeCategory?.name ?? (query.q ? `“${query.q}”` : "Everything we have")}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">
          {activeCategory?.blurb ??
            "Single-piece inventory, measured by hand. Filter it down, then move fast — there is only ever one of each."}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
        <aside className="lg:sticky lg:top-44 lg:self-start">
          <ShopFilters
            categories={categories}
            counts={counts}
            sizes={facets.sizes}
            brands={facets.brands}
            active={query}
            total={totalInStock}
          />
        </aside>

        <section>
          <div className="flex items-baseline justify-between gap-4 pb-6">
            <p className="text-sm text-ink-soft">
              {result.total} {result.total === 1 ? "piece" : "pieces"}
              {result.pages > 1 && ` · page ${result.page} of ${result.pages}`}
            </p>
          </div>

          {result.items.length === 0 ? (
            <div className="panel px-6 py-20 text-center">
              <h2 className="font-display text-3xl font-extrabold tracking-tight">Nothing matches that</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
                Our stock turns over weekly, so try a looser filter — or tell us
                what you are hunting for and we will watch for it.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/shop" className="btn btn-ink">
                  Clear filters
                </Link>
                <Link href="/contact" className="btn btn-ghost">
                  Send a wishlist
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((item, i) => (
                <ItemCard key={item.id} item={item} priority={i < 3} />
              ))}
            </div>
          )}

          {result.pages > 1 && (
            <nav className="mt-14 flex items-center justify-between" aria-label="Pagination">
              {result.page > 1 ? (
                <Link href={pageHref(result.page - 1)} className="text-sm font-semibold underline">
                  ← Previous
                </Link>
              ) : (
                <span className="text-sm text-ink-faint">← Previous</span>
              )}
              <div className="flex gap-1.5">
                {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={pageHref(n)}
                    aria-current={n === result.page ? "page" : undefined}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm ${
                      n === result.page
                        ? "bg-ink font-semibold text-paper"
                        : "bg-white ring-1 ring-black/10 hover:bg-reef hover:text-white"
                    }`}
                  >
                    {n}
                  </Link>
                ))}
              </div>
              {result.page < result.pages ? (
                <Link href={pageHref(result.page + 1)} className="text-sm font-semibold underline">
                  Next →
                </Link>
              ) : (
                <span className="text-sm text-ink-faint">Next →</span>
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
