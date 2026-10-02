import Link from "next/link";
import { SharkMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="wrap max-w-xl py-28 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-ink text-reef">
        <SharkMark className="h-8 w-8" />
      </span>
      <h1 className="mt-6 font-display text-5xl font-extrabold tracking-[-0.04em]">
        That one got away
      </h1>
      <p className="mt-3 leading-relaxed text-ink-soft">
        Either this page never existed, or the piece sold and swam off. Our stock
        is single-piece, so links do go stale — the rest of the rack is still
        here.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn btn-ink">
          Back to the shop
        </Link>
        <Link href="/shop?includeSold=1" className="btn btn-ghost">
          Browse the sold archive
        </Link>
      </div>
    </div>
  );
}
