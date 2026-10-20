import Link from "next/link";
import { redirect } from "next/navigation";
import { ShopSettingsForm } from "@/components/shop-settings-form";
import { StripeConnectPanel } from "@/components/stripe-connect-panel";
import { requireSeller } from "@/lib/seller-auth";
import { createSellerAccountLink, syncSellerFromStripeAccount } from "@/lib/stripe-connect";
import { stripeConfigured } from "@/lib/stripe";
import { toShopSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ShopSettingsPage(props: PageProps<"/dashboard/shop">) {
  const seller = await requireSeller();
  const params = await props.searchParams;
  const stripeFlag = typeof params.stripe === "string" ? params.stripe : null;
  const errorMsg =
    typeof params.msg === "string" && params.msg.trim() ? params.msg.trim() : null;

  let notice: string | null = null;

  // Stripe sends people here when the Account Link expired or was reused —
  // mint a new link and send them straight back into onboarding.
  if (stripeConfigured() && seller.stripe_account_id && stripeFlag === "refresh") {
    const link = await createSellerAccountLink(seller);
    if (link.ok) redirect(link.url);
    notice = link.error;
  }

  if (stripeFlag === "error" && errorMsg) {
    notice = errorMsg;
  }

  if (stripeConfigured() && seller.stripe_account_id && stripeFlag === "done") {
    try {
      await syncSellerFromStripeAccount(seller.stripe_account_id);
      const fresh = await requireSeller();
      Object.assign(seller, fresh);
      notice = fresh.stripe_charges_enabled
        ? "Stripe setup complete — buyers can pay you by card."
        : "Stripe saved your progress. If charges are still off, use Continue below.";
    } catch {
      notice = "Could not refresh Stripe status. Use Refresh status below.";
    }
  }

  return (
    <div>
      <header className="mb-8">
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em]">
          Your storefront
        </h2>
        <p className="mt-2 text-ink-soft">
          This is what buyers see at{" "}
          <Link href={`/shop/${seller.handle}`} className="underline hover:text-reef-dark">
            /shop/{seller.handle}
          </Link>
          .
        </p>
      </header>

      {stripeConfigured() ? (
        <StripeConnectPanel seller={toShopSettings(seller)} notice={notice} />
      ) : (
        <p className="panel mb-8 px-5 py-4 text-sm text-coral">
          Stripe keys are missing on this server. Add{" "}
          <code className="font-mono">STRIPE_SECRET_KEY</code> to the host env and
          redeploy.
        </p>
      )}

      <ShopSettingsForm seller={toShopSettings(seller)} />
    </div>
  );
}
