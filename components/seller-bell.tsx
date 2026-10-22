"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { markNoticesRead } from "@/lib/actions";
import { shortWhen } from "@/lib/format";

export type BellNotice = {
  id: number;
  kind: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

const LABEL: Record<string, string> = {
  sale: "Sold",
  auction_sold: "Auction won",
  offer: "Offer",
  hunt: "Hunt",
  verified_expiring: "Verified",
};

const FALLBACK_HREF: Record<string, string> = {
  sale: "/dashboard/orders",
  auction_sold: "/dashboard/orders",
  offer: "/dashboard/offers",
  hunt: "/hunts",
  verified_expiring: "/dashboard/verified",
};

/** Header bell for a shop: sales, offers, and buyer messages, one tap away. */
export function SellerBell({
  notices,
  unread,
  waiting,
  open,
  onToggle,
  onClose,
}: {
  notices: BellNotice[];
  unread: number;
  waiting: number;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const total = unread + waiting;

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-label={total > 0 ? `Notifications, ${total} new` : "Notifications"}
        onClick={() => {
          if (!open && unread > 0) {
            void markNoticesRead().then(() => router.refresh());
          }
          onToggle();
        }}
        className="tap relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-white hover:bg-white/10"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" strokeLinejoin="round" />
          <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" />
        </svg>
        {total > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-4 rounded-full bg-coral px-1 text-center text-[10px] leading-4 font-bold text-white tabular-nums">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close notifications"
          onClick={onClose}
          className="fixed inset-0 z-40 cursor-default"
        />
      )}
      {open && (
        <div className="absolute top-full right-3 z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-line bg-paper text-ink shadow-lg">
          <p className="border-b border-line px-4 py-3 font-display text-base font-bold">Notifications</p>
          <ul className="max-h-[60dvh] divide-y divide-line overflow-y-auto">
            {waiting > 0 && (
              <li>
                <Link
                  href="/dashboard/messages"
                  onClick={onClose}
                  className="block bg-reef/5 px-4 py-3 text-sm hover:bg-paper-dim"
                >
                  <span className="font-semibold">
                    {waiting} buyer message{waiting === 1 ? "" : "s"} waiting on you
                  </span>
                </Link>
              </li>
            )}
            {notices.map((notice) => (
              <li key={notice.id}>
                <Link
                  href={notice.href ?? FALLBACK_HREF[notice.kind] ?? "/dashboard/messages"}
                  onClick={onClose}
                  className={`block px-4 py-3 text-sm hover:bg-paper-dim ${notice.read_at ? "" : "bg-gold/5"}`}
                >
                  <span className="text-[10px] font-bold tracking-wider text-ink-faint uppercase">
                    {LABEL[notice.kind] ?? "Thrift Sharks"} · {shortWhen(notice.created_at)}
                    {!notice.read_at && <span className="ml-1.5 text-coral">New</span>}
                  </span>
                  <span className="mt-0.5 line-clamp-3 block break-anywhere">{notice.body}</span>
                </Link>
              </li>
            ))}
            {notices.length === 0 && waiting === 0 && (
              <li className="px-4 py-6 text-center text-sm text-ink-soft">
                Nothing yet. Sales, offers, and messages show up here.
              </li>
            )}
          </ul>
          <Link
            href="/dashboard/messages"
            onClick={onClose}
            className="tap block border-t border-line px-4 py-3 text-center text-sm font-semibold hover:bg-paper-dim"
          >
            See all
          </Link>
        </div>
      )}
    </>
  );
}
