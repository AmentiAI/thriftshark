import type { Metadata } from "next";
import { BagView } from "@/components/bag-view";

export const metadata: Metadata = {
  title: "Your bag",
  description: "Review the pieces in your bag before checking out.",
};

export default function CartPage() {
  return (
    <div className="wrap py-12">
      <header className="pb-2">
        <p className="eyebrow-pill">Step 1 of 2</p>
        <h1 className="mt-5 font-display text-5xl font-extrabold tracking-[-0.05em]">Your bag</h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Nothing is reserved until you check out — single-piece inventory means
          first paid, first served.
        </p>
      </header>
      <div className="pt-10">
        <BagView />
      </div>
    </div>
  );
}
