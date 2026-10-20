import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { currentSeller } from "@/lib/seller-auth";
import { isSellerVerified } from "@/lib/seller-plan";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure checkout on Thrift Sharks.",
};

export default async function CheckoutPage() {
  const seller = await currentSeller();
  const buyerVerified = Boolean(seller && isSellerVerified(seller));

  return (
    <div className="wrap py-12">
      <header className="pb-2">
        <p className="eyebrow-pill">Thrift Sharks · Checkout</p>
        <h1 className="mt-5 font-display text-5xl font-extrabold tracking-[-0.05em]">Checkout</h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Placing the order takes your pieces off the rack. Next you&apos;ll pay
          securely by card — money goes to the seller through Stripe.
        </p>
      </header>
      <div className="pt-10">
        <CheckoutForm buyerVerified={buyerVerified} />
      </div>
    </div>
  );
}
