import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BuyerCheck } from "@/components/buyer-check";
import { startBuyerVerified, signOutSeller } from "@/lib/actions";
import {
  BUYER_VERIFIED_PRICE_USD,
  currentBuyer,
  isBuyerVerified,
} from "@/lib/buyer-account";
import { confirmBuyerVerifiedCheckout } from "@/lib/stripe-billing";
import { stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false },
};

function untilLabel(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function AccountPage(props: PageProps<"/account">) {
  let buyer = await currentBuyer();
  if (!buyer) redirect("/login?next=/account");

  const params = await props.searchParams;
  const planFlag = typeof params.plan === "string" ? params.plan : null;
  const sessionId = typeof params.session_id === "string" ? params.session_id : null;
  const errorMsg =
    typeof params.msg === "string" && params.msg.trim() ? params.msg.trim() : null;

  let notice: string | null = null;
  if (planFlag === "done" && sessionId && stripeConfigured()) {
    try {
      buyer = await confirmBuyerVerifiedCheckout(buyer, sessionId);
      notice = isBuyerVerified(buyer)
        ? "Payment received — you’re Verified for 30 days and entered in this week’s giveaway."
        : "Checkout finished. If the check is not on yet, refresh in a moment.";
    } catch {
      notice = "Could not confirm that payment yet. Refresh in a moment.";
    }
  } else if (planFlag === "cancel") {
    notice = "Checkout canceled — you can pay anytime.";
  } else if (planFlag === "error" && errorMsg) {
    notice = errorMsg;
  }

  const verified = isBuyerVerified(buyer);
  const until = untilLabel(buyer.verified_until);

  return (
    <div className="wrap max-w-xl py-12">
      <p className="eyebrow-pill">Your account</p>
      <div className="mt-3 flex items-center gap-3">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">{buyer.name}</h1>
        {verified && <BuyerCheck className="h-7 w-7" />}
      </div>
      <p className="mt-2 break-anywhere text-sm text-ink-soft">{buyer.email}</p>

      {notice && (
        <p className="mt-6 rounded-2xl bg-kelp/10 px-4 py-3 text-sm">{notice}</p>
      )}

      <section className="panel mt-8 p-6">
        <h2 className="font-display text-xl font-bold">Buyer Verified</h2>
        <p className="mt-2 text-sm text-ink-soft">
          ${BUYER_VERIFIED_PRICE_USD} for 30 days. You get a green check, you’re
          entered in the weekly giveaway, and checkout has no platform fee.
          Paying again stacks another 30 days.
        </p>
        {verified && until && (
          <p className="mt-4 text-sm font-semibold">Verified through {until}.</p>
        )}
        <form action={startBuyerVerified} className="mt-5">
          <button className="btn btn-ink w-full sm:w-auto">
            {verified ? `Add 30 days — $${BUYER_VERIFIED_PRICE_USD}` : `Get Verified — $${BUYER_VERIFIED_PRICE_USD}`}
          </button>
        </form>
      </section>

      <form action={signOutSeller} className="mt-6">
        <button className="text-sm font-semibold text-ink-faint underline">Sign out</button>
      </form>
    </div>
  );
}
