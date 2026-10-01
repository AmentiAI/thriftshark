"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BagCount } from "@/components/bag-count";
import { Wordmark } from "@/components/logo";

const NAV = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?sort=newest", label: "New in" },
  { href: "/sell", label: "Sell to us" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur">
      <div className="bg-ink text-center text-[11px] font-semibold tracking-[0.18em] text-paper/90 uppercase">
        <p className="wrap py-2">
          Free shipping over $150 · New finds posted every Thursday
        </p>
      </div>

      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Link href="/" className="shrink-0" aria-label="Thrift Shark home">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {NAV.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-sm font-medium transition hover:text-reef-dark ${
                pathname === link.href.split("?")[0] ? "text-reef-dark" : "text-ink-soft"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="flex items-center border border-ink px-4 py-2 text-sm font-semibold tracking-wide uppercase transition hover:bg-ink hover:text-paper"
          >
            Bag
            <BagCount />
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className="border border-line p-2.5 md:hidden"
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

      {open && (
        <nav className="border-t border-line bg-paper md:hidden" aria-label="Mobile">
          <div className="wrap flex flex-col py-2">
            {NAV.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-line/60 py-3 text-sm font-medium last:border-0"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
