"use client";

import Form from "next/form";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { BagCount } from "@/components/bag-count";
import { BuyerCheck } from "@/components/buyer-check";
import { GiveawayNav } from "@/components/giveaway-nav";
import { Wordmark } from "@/components/logo";
import { SellerBell, type BellNotice } from "@/components/seller-bell";
import { ShopAvatar } from "@/components/shop-avatar";
import type { WeeklyGiveaway } from "@/lib/types";

/** Always in the bar on desktop. Everything else lives in the menu. */
const PRIMARY = [
  { href: "/shop", label: "Shop" },
  { href: "/auctions", label: "Auctions" },
  { href: "/live", label: "Live" },
  { href: "/sell", label: "Sell" },
];

const BROWSE = [
  { href: "/shop", label: "Shop everything" },
  { href: "/auctions", label: "Auctions" },
  { href: "/live", label: "Live shows" },
  { href: "/hunts", label: "Hunts" },
  { href: "/sellers", label: "Shops" },
];

function CategoryLinks({
  categories,
  activeCategory,
}: {
  categories: { slug: string; name: string }[];
  activeCategory: string | null;
}) {
  return (
    <nav aria-label="Categories">
      <div className="wrap scroll-x flex gap-5 py-2.5">
        <Link
          href="/shop"
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

function CategoryLinksLive({ categories }: { categories: { slug: string; name: string }[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = pathname === "/shop" ? (searchParams.get("category") ?? "") : null;
  return <CategoryLinks categories={categories} activeCategory={activeCategory} />;
}

export type NavSeller = {
  shop_name: string;
  handle: string;
  logo_image_id: number | null;
  /** Unread notices plus buyer messages waiting on a reply. */
  alerts: number;
  unread: number;
  waiting: number;
  notices: BellNotice[];
};

function AlertCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="rounded-full bg-coral px-1.5 py-0.5 text-[11px] leading-none font-bold text-white tabular-nums">
      {count > 99 ? "99+" : count}
    </span>
  );
}

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

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MenuLink({ href, children, onClick }: { href: string; children: ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="tap flex items-center justify-between rounded-xl px-3 py-3 text-base font-semibold hover:bg-paper-dim"
    >
      {children}
    </Link>
  );
}

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
  const [bellOpen, setBellOpen] = useState(false);
  const close = () => setOpen(false);
  const showCategories = pathname === "/" || pathname === "/shop";

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-white/10 bg-black text-white">
        <div className="wrap relative !px-3 sm:!px-5">
          <div className="flex h-14 items-center gap-2 sm:h-16 sm:gap-4">
            <Link href="/" className="shrink-0" aria-label="Thrift Sharks home" onClick={close}>
              <Wordmark className="h-8 w-auto sm:h-10" />
            </Link>

            <nav className="hidden items-center lg:flex" aria-label="Main">
              {PRIMARY.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      active ? "text-white" : "text-white/65 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <Form action="/shop" className="relative mx-auto hidden min-w-0 max-w-md flex-1 md:block">
              <label className="sr-only" htmlFor="nav-search">
                Search finds
              </label>
              <input
                id="nav-search"
                name="q"
                placeholder="Search"
                className="field !border-white/15 !bg-white/10 !py-2 pr-10 pl-4 !text-white placeholder:!text-white/45"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center text-white/55 hover:text-white"
              >
                <SearchIcon />
              </button>
            </Form>

            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:ml-0">
              {giveaway && (
                <GiveawayNav
                  giveaway={giveaway.giveaway}
                  alreadyEntered={giveaway.alreadyEntered}
                  account={giveaway.account}
                  buyerVerified={giveaway.buyerVerified}
                  open={giveawayOpen}
                  onToggle={() => {
                    setOpen(false);
                    setBellOpen(false);
                    setGiveawayOpen((v) => !v);
                  }}
                />
              )}

              {seller ? (
                <>
                  <SellerBell
                    notices={seller.notices}
                    unread={seller.unread}
                    waiting={seller.waiting}
                    open={bellOpen}
                    onToggle={() => {
                      setOpen(false);
                      setGiveawayOpen(false);
                      setBellOpen((v) => !v);
                    }}
                    onClose={() => setBellOpen(false)}
                  />
                  <Link
                    href="/dashboard"
                    aria-label="Your shop"
                    className="tap flex items-center gap-2 rounded-full p-1 text-sm font-medium text-white/85 hover:bg-white/10 sm:pr-2.5"
                  >
                    <ShopAvatar shopName={seller.shop_name} logoImageId={seller.logo_image_id} size={28} />
                    <span className="hidden max-w-[7rem] truncate sm:inline">{seller.shop_name}</span>
                  </Link>
                </>
              ) : buyer ? (
                <Link
                  href="/account"
                  aria-label="Your account"
                  className="tap flex items-center gap-1.5 rounded-full px-2 text-sm font-medium text-white/85 hover:bg-white/10"
                >
                  {buyer.verified && <BuyerCheck className="h-4 w-4" />}
                  <span className="max-w-[5.5rem] truncate sm:max-w-[7rem]">{buyer.name}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="tap flex items-center rounded-full px-2.5 text-sm font-semibold whitespace-nowrap text-white hover:bg-white/10"
                >
                  Log in
                </Link>
              )}

              <Link
                href="/cart"
                aria-label="Bag"
                className="tap relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-white hover:bg-white/10"
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
                  <path d="M5 7h10l-.8 9H5.8L5 7z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
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

              <button
                type="button"
                onClick={() => {
                  setGiveawayOpen(false);
                  setBellOpen(false);
                  setOpen((v) => !v);
                }}
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
                className="tap grid h-10 w-10 shrink-0 place-items-center rounded-full text-white hover:bg-white/10"
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
      </div>

      {showCategories && (
        <div className="border-b border-line bg-paper">
          <Suspense fallback={<CategoryLinks categories={categories} activeCategory={null} />}>
            <CategoryLinksLive categories={categories} />
          </Suspense>
        </div>
      )}

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="fixed inset-0 top-14 z-40 cursor-default bg-black/30 sm:top-16"
          />
          <nav
            aria-label="Menu"
            className="absolute inset-x-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-line bg-paper px-3 pt-3 pb-5 shadow-lg sm:top-16 sm:right-5 sm:left-auto sm:w-80 sm:rounded-b-2xl sm:border-x"
          >
            <Form action="/shop" className="relative mb-2 md:hidden" onSubmit={close}>
              <input name="q" placeholder="Search finds" aria-label="Search finds" className="field !bg-paper-dim pr-10" />
              <button
                type="submit"
                aria-label="Search"
                className="absolute top-1/2 right-2 grid h-9 w-9 -translate-y-1/2 place-items-center text-ink-faint"
              >
                <SearchIcon />
              </button>
            </Form>

            <div className="flex flex-col">
              {BROWSE.map((link) => (
                <MenuLink key={link.href} href={link.href} onClick={close}>
                  {link.label}
                </MenuLink>
              ))}
            </div>

            <div className="mt-2 flex flex-col border-t border-line pt-2">
              {seller ? (
                <>
                  <MenuLink href="/dashboard" onClick={close}>
                    Your shop
                  </MenuLink>
                  <MenuLink href="/dashboard/messages" onClick={close}>
                    Notifications
                    <AlertCount count={seller.alerts} />
                  </MenuLink>
                  <MenuLink href="/dashboard/items/new" onClick={close}>
                    Add a listing
                  </MenuLink>
                </>
              ) : buyer ? (
                <>
                  <MenuLink href="/account" onClick={close}>
                    Your account
                  </MenuLink>
                  <MenuLink href="/inbox" onClick={close}>
                    Messages
                  </MenuLink>
                  <MenuLink href="/sell" onClick={close}>
                    Sell on Thrift Sharks
                  </MenuLink>
                </>
              ) : (
                <>
                  <MenuLink href="/inbox" onClick={close}>
                    Messages
                  </MenuLink>
                  <MenuLink href="/sell" onClick={close}>
                    Sell on Thrift Sharks
                  </MenuLink>
                  <div className="mt-3 grid grid-cols-2 gap-2 px-1">
                    <Link href="/login" onClick={close} className="btn btn-ghost">
                      Log in
                    </Link>
                    <Link href="/signup" onClick={close} className="btn btn-ink">
                      Sign up
                    </Link>
                  </div>
                </>
              )}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
