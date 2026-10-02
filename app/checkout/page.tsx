import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Place your Thrift Shark order.",
};

export default function CheckoutPage() {
  return (
    <div className="wrap py-12">
      <header className="pb-2">
        <p className="eyebrow-pill">Step 2 of 2</p>
        <h1 className="mt-5 font-display text-5xl font-extrabold tracking-[-0.05em]">Checkout</h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Placing the order takes your pieces off the rack straight away. We
          follow up by email with payment.
        </p>
      </header>
      <div className="pt-10">
        <CheckoutForm />
      </div>
    </div>
  );
}
