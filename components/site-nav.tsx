"use client";

import Form from "next/form";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BagCount } from "@/components/bag-count";
import { BuyerCheck } from "@/components/buyer-check";
import { GiveawayNav } from "@/components/giveaway-nav";
import { Wordmark } from "@/components/logo";
import { ShopAvatar } from "@/components/shop-avatar";
import type { WeeklyGiveaway } from "@/lib/types";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/auctions", label: "Auctions" },
  { href: "/sellers", label: "Shops" },
  { href: "/sell", label: "Sell" },
];

const TICKER = [
  "Real people",
  "Real brands",
  "Secondhand heat",
  "Buy / sell / trade",
  "Paid through Stripe",
  "One of one",
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
    <nav aria-label="Categories">
      <div className="wrap scroll-x flex gap-5 py-2.5">
        <Link
          href="/shop"
          onClick={onNavigate}
          aria-current={activeCategory === "" ? "page" : undefined}
          className={`tap shrink-0 text-sm font-medium whitespace-nowrap transition ${
            activeCategory === "" ? "text-ink" : "text-ink-faint hover:text-ink"
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
              className={`tap shrink-0 text-sm font-medium whitespace-nowrap transition ${
                active ? "text-ink" : "text-ink-faint hover:text-ink"
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

export type NavBuyer = {
  name: string;
  verified: boolean;
};

export type NavGiveaway = {
  giveaway: WeeklyGiveaway;
  alreadyEntered: boolean;
  account: "guest" | "shop" | "buyer";
  buyerVerified: boolean;
};

export function SiteNav({
  categories,
  seller,
  buyer,
  giveaway,
}: {
  categories: { slug: string; name: string }[];
  seller: NavSeller | null;
  buyer?: NavBuyer | null;
  giveaway?: NavGiveaway | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [giveawayOpen, setGiveawayOpen] = useState(false);
  const loop = [...TICKER, ...TICKER];

  return (
    <header className="sticky top-0 z-50">
      <div className="overflow-hidden bg-blood text-white">
        <div className="ticker-track gap-7 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase sm:gap-9 sm:text-[11px]">
          {loop.map((line, i) => (
            <span key={`${line}-${i}`} className="flex items-center gap-7 whitespace-nowrap sm:gap-9">
              {line}
              <span aria-hidden className="text-white/40">
                •
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="border-b border-white/10 bg-black text-white">
        <div className="wrap relative flex h-14 items-center gap-2 !px-3 sm:h-[4.25rem] sm:gap-5 sm:!px-5">
          <Link href="/" className="shrink-0" aria-label="Thrift Sharks home" onClick={() => setOpen(false)}>
            <Wordmark className="h-8 w-auto sm:h-11" />
          </Link>

          <Form action="/shop" className="relative mx-auto hidden min-w-0 max-w-xl flex-1 md:block">
            <label className="sr-only" htmlFor="nav-search">
              Search finds
            </label>
            <input
              id="nav-search"
              name="q"
              placeholder="Search for items, brands, or shops"
              className="field !border-white/15 !bg-white/10 !py-2.5 pr-11 pl-4 !text-white placeholder:!text-white/45"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center text-white/50 hover:text-white"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
                <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </Form>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2">
            {giveaway && (
              <GiveawayNav
                giveaway={giveaway.giveaway}
                alreadyEntered={giveaway.alreadyEntered}
                account={giveaway.account}
                buyerVerified={giveaway.buyerVerified}
                open={giveawayOpen}
                onToggle={() => {
                  setOpen(false);
                  setGiveawayOpen((v) => !v);
                }}
              />
            )}
            <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
              {NAV.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(`${link.href}/`));
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                      isActive ? "text-white" : "text-white/60 hover:text-white"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/inbox"
              className={`hidden rounded-full px-2.5 py-2 text-sm font-medium sm:block ${
                pathname.startsWith("/inbox") ? "text-white" : "text-white/60 hover:text-white"
              }`}
            >
              Inbox
            </Link>

            {seller ? (
              <Link
                href="/dashboard"
                className="hidden items-center gap-2 rounded-full py-1 pr-2.5 pl-1 text-sm font-medium text-white/80 hover:bg-white/10 sm:flex"
              >
                <ShopAvatar
                  shopName={seller.shop_name}
                  logoImageId={seller.logo_image_id}
                  size={28}
                />
                <span className="max-w-[7rem] truncate">{seller.shop_name}</span>
              </Link>
            ) : buyer ? (
              <Link
                href="/account"
                className="tap flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
              >
                {buyer.verified && <BuyerCheck className="h-4 w-4" />}
                <span className="max-w-[7rem] truncate">{buyer.name}</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="btn !hidden !bg-white !px-3.5 !py-2 text-sm !text-black hover:!bg-white/90 sm:!inline-flex"
                >
                  Create account
                </Link>
                <Link
                  href="/login"
                  className="tap shrink-0 rounded-full px-2 py-2 text-sm font-medium whitespace-nowrap text-white/80 hover:text-white"
                >
                  Log in
                </Link>
              </>
            )}

            <Link
              href="/cart"
              aria-label="Bag"
              className="tap relative grid h-9 w-9 shrink-0 place-items-center rounded-full text-white sm:hidden"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
                <path
                  d="M5 7h10l-.8 9H5.8L5 7z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M7.5 7V5.5a2.5 2.5 0 015 0V7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <BagCount className="absolute top-0.5 right-0.5" />
            </Link>
            <Link
              href="/cart"
              className="btn !hidden shrink-0 !border-white/25 !bg-transparent !px-3 !py-2 text-sm whitespace-nowrap !text-white hover:!bg-white/10 sm:!inline-flex"
            >
              Bag
              <BagCount />
            </Link>

            <button
              onClick={() => {
                setGiveawayOpen(false);
                setOpen((v) => !v);
              }}
              aria-expanded={open}
              aria-label="Toggle menu"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white sm:h-10 sm:w-10 lg:hidden"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
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
      </div>

      <div className="border-b border-line bg-paper">
        <Suspense fallback={<CategoryLinks categories={categories} activeCategory={null} />}>
          <CategoryLinksLive categories={categories} onNavigate={() => setOpen(false)} />
        </Suspense>
      </div>

      {open && (
        <nav
          className="absolute inset-x-0 top-full max-h-[75dvh] overflow-y-auto border-b border-line bg-paper px-5 py-5 shadow-lg lg:hidden"
          aria-label="Mobile"
        >
          <Form action="/shop" className="mb-4" onSubmit={() => setOpen(false)}>
            <input name="q" placeholder="Search finds…" className="field !bg-paper-dim" />
          </Form>
          <div className="flex flex-col">
            {[...NAV, { href: "/about", label: "About" }, { href: "/contact", label: "Contact" }, { href: "/inbox", label: "Inbox" }].map(
              (link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-line py-3.5 text-base font-semibold"
                >
                  {link.label}
                </Link>
              ),
            )}
            <Link
              href={seller ? "/dashboard" : buyer ? "/account" : "/signup"}
              onClick={() => setOpen(false)}
              className="btn btn-ink mt-4 w-full"
            >
              {seller ? "Dashboard" : buyer ? "Your account" : "Create account"}
            </Link>
            {!seller && !buyer && (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-2 py-3 text-center text-sm font-medium text-ink-faint"
              >
                Log in
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
