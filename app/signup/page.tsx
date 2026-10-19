import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SignupForm } from "@/components/signup-form";
import { currentSeller } from "@/lib/seller-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open your shop",
  description:
    "Open a Thrift Sharks shop in about a minute. Your storefront, paid through Stripe.",
};

const PERKS = [
  ["Free to open", "No listing fees. No monthly fee."],
  ["Your storefront", "Your page at /shop/you — logo, banner, bio."],
  ["Paid via Stripe", "Buyers pay you by card at checkout."],
  ["Live immediately", "Public the moment you sign up."],
];

export default async function SignupPage() {
  if (await currentSeller()) redirect("/dashboard");

  return (
    <div className="wrap grid gap-10 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:py-14">
      <div className="order-2 lg:order-1">
        <p className="eyebrow-pill">Start selling</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Your shop, your money
        </h1>
        <p className="mt-3 max-w-md text-ink-soft">
          A marketplace, not a middleman. You set prices; buyers cover a small
          platform fee at checkout.
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
        <h2 className="font-display text-xl font-bold tracking-tight">Open your shop</h2>
        <p className="mt-1 text-sm text-ink-faint">About a minute. Add photos after.</p>
        <div className="mt-6">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
