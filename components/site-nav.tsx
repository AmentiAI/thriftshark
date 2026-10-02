"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BagCount } from "@/components/bag-count";
import { Wordmark } from "@/components/logo";
import { ShopAvatar } from "@/components/shop-avatar";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/auctions", label: "Auctions" },
  { href: "/sellers", label: "Shops" },
  { href: "/sell", label: "Sell" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const TICKER = [
  "Open your own shop free",
  "Paid straight to Cash App",
  "One of one",
  "Your logo, your storefront",
  "List in under a minute",
  "Thousands of finds",
];

function CategoryLinks({
  categories,
  activeCategory,
  onNavigate,
}: {
  categories: { slug: string; name: string }[];
  activeCategory: string | null;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Categories" className="border-t border-white/10 bg-blood">
      <div className="wrap flex gap-1.5 overflow-x-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href="/shop"
          onClick={onNavigate}
          aria-current={activeCategory === "" ? "page" : undefined}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition ${
            activeCategory === ""
              ? "bg-white text-blood"
              : "text-white hover:bg-white/15"
          }`}
        >
          All
        </Link>
        {categories.map((category) => {
          const active = activeCategory === category.slug;
          return (
            <Link
              key={category.slug}
              href={`/shop?category=${category.slug}`}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition ${
                active ? "bg-white text-blood" : "text-white hover:bg-white/15"
              }`}
            >
              {category.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function CategoryLinksLive({
  categories,
  onNavigate,
}: {
  categories: { slug: string; name: string }[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = pathname === "/shop" ? (searchParams.get("category") ?? "") : null;
  return <CategoryLinks categories={categories} activeCategory={activeCategory} onNavigate={onNavigate} />;
}

export type NavSeller = {
  shop_name: string;
  handle: string;
  logo_image_id: number | null;
};

export function SiteNav({
  categories,
  seller,
}: {
  categories: { slug: string; name: string }[];
  seller: NavSeller | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const loop = [...TICKER, ...TICKER];

  return (
    <header className="sticky top-0 z-50">
      <div className="overflow-hidden bg-ink text-foam">
        <div className="ticker-track gap-8 py-2 text-[11px] font-bold tracking-[0.22em] uppercase">
          {loop.map((line, i) => (
            <span key={`${line}-${i}`} className="flex items-center gap-8 whitespace-nowrap">
              {line}
              <span aria-hidden className="text-gold">
                ✦
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="border-b border-white/10 bg-black">
        <div className="wrap flex items-center justify-between gap-4 py-1.5">
          <Link href="/" className="shrink-0" aria-label="Thrift Sharks home" onClick={() => setOpen(false)}>
            <Wordmark className="h-11 w-auto sm:h-14" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((link) => {
              const isActive = !link.href.includes("?") && pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                    isActive ? "bg-reef text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {seller ? (
              <Link
                href="/dashboard"
                className="hidden items-center gap-2 rounded-full bg-white/10 py-1.5 pr-4 pl-1.5 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/15 sm:flex"
              >
                <ShopAvatar
                  shopName={seller.shop_name}
                  logoImageId={seller.logo_image_id}
                  size={28}
                />
                <span className="max-w-28 truncate">{seller.shop_name}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-full px-4 py-2.5 text-sm font-bold text-white/80 transition hover:text-white sm:block"
              >
                Sign in
              </Link>
            )}
            <Link href="/cart" className="btn btn-lime !px-5 !py-2.5">
              Bag
              <BagCount />
            </Link>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label="Toggle menu"
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink lg:hidden"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                <path
                  d={open ? "M4 4l12 12M16 4L4 16" : "M3 6h14M3 10h14M3 14h14"}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <Suspense fallback={<CategoryLinks categories={categories} activeCategory={null} />}>
          <CategoryLinksLive categories={categories} onNavigate={() => setOpen(false)} />
        </Suspense>
      </div>

      {open && (
        <nav className="absolute inset-x-0 top-full border-b border-line bg-paper px-6 py-4 shadow-2xl lg:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {NAV.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-3 py-3 font-display text-2xl font-extrabold tracking-tight hover:bg-reef hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={seller ? "/dashboard" : "/login"}
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-2xl bg-ink px-3 py-3 font-display text-2xl font-extrabold tracking-tight text-paper"
            >
              {seller ? (
                <>
                  <ShopAvatar
                    shopName={seller.shop_name}
                    logoImageId={seller.logo_image_id}
                    size={32}
                  />
                  <span className="truncate">Dashboard</span>
                </>
              ) : (
                "Seller sign in"
              )}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
