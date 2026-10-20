import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SignupForm } from "@/components/signup-form";
import { currentBuyer } from "@/lib/buyer-account";
import { currentSeller } from "@/lib/seller-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Shop as a buyer, or open a Thrift Sharks store.",
};

const PERKS = [
  ["Buyer or store", "Shop with an account, or open your own storefront."],
  ["Verified is $10", "30 days: green check, giveaways, no platform fee."],
  ["Stores are free", "No listing fee. Connect Stripe and get paid."],
  ["Checkout needs an account", "Sign in before you pay."],
];

export default async function SignupPage() {
  if (await currentSeller()) redirect("/dashboard");
  if (await currentBuyer()) redirect("/account");

  return (
    <div className="wrap grid gap-10 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:py-14">
      <div className="order-2 lg:order-1">
        <p className="eyebrow-pill">Create an account</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Buyer or store
        </h1>
        <p className="mt-3 max-w-md text-ink-soft">
          Everyone checks out with an account. Buyers can go Verified for $10 a
          month. Stores are free to open.
        </p>
        <dl className="mt-8 space-y-4">
          {PERKS.map(([title, body], i) => (
            <div key={title} className="flex gap-3 border-t border-line pt-4">
              <span className="w-7 shrink-0 text-sm font-semibold text-ink-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <dt className="font-semibold">{title}</dt>
                <dd className="mt-0.5 text-sm text-ink-faint">{body}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      <div className="order-1 panel p-5 sm:p-8 lg:order-2">
        <h2 className="font-display text-xl font-bold tracking-tight">Create your account</h2>
        <p className="mt-1 text-sm text-ink-faint">Pick buyer, or open a store.</p>
        <div className="mt-6">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
