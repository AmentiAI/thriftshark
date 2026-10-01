import Link from "next/link";
import { SharkMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="wrap max-w-xl py-28 text-center">
      <SharkMark className="mx-auto h-14 w-14 text-reef" />
      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight">
        That one got away
      </h1>
      <p className="mt-3 leading-relaxed text-ink-soft">
        Either this page never existed, or the piece sold and swam off. Our stock
        is single-piece, so links do go stale — the rest of the rack is still
        here.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="bg-ink px-6 py-3.5 text-sm font-semibold tracking-wide text-paper uppercase">
          Back to the shop
        </Link>
        <Link href="/shop?includeSold=1" className="border border-ink px-6 py-3.5 text-sm font-semibold tracking-wide uppercase">
          Browse the sold archive
        </Link>
      </div>
    </div>
  );
}
