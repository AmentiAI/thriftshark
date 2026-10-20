import { SellerSubscriptionPanel } from "@/components/seller-subscription-panel";
import { requireSeller } from "@/lib/seller-auth";
import { confirmVerifiedPassCheckout } from "@/lib/stripe-billing";
import { stripeConfigured } from "@/lib/stripe";
import { toShopSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VerifiedPage(props: PageProps<"/dashboard/verified">) {
  let seller = await requireSeller();
  const params = await props.searchParams;
  const planFlag = typeof params.plan === "string" ? params.plan : null;
  const sessionId = typeof params.session_id === "string" ? params.session_id : null;
  const errorMsg =
    typeof params.msg === "string" && params.msg.trim() ? params.msg.trim() : null;

  let notice: string | null = null;

  if (planFlag === "done" && sessionId && stripeConfigured()) {
    try {
      seller = await confirmVerifiedPassCheckout(seller, sessionId);
      notice = seller.verified_until && new Date(seller.verified_until).getTime() > Date.now()
        ? "Payment received — Verified is on for 30 days."
        : "Checkout finished. If the badge is not on yet, refresh in a moment.";
    } catch {
      notice = "Could not confirm that payment yet. Refresh in a moment.";
    }
  } else if (planFlag === "cancel") {
    notice = "Checkout canceled — you can pay anytime.";
  } else if (planFlag === "error" && errorMsg) {
    notice = errorMsg;
  }

  return (
    <div>
      <header className="mb-8">
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em]">
          Verified
        </h2>
        <p className="mt-2 max-w-xl text-ink-soft">
          Pay for 30 days. You’ll get a message here a day before it ends so you
          can pay again.
        </p>
      </header>
      <SellerSubscriptionPanel seller={toShopSettings(seller)} notice={notice} />
    </div>
  );
}
