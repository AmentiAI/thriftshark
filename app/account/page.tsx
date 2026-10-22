import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { BuyerCheck } from "@/components/buyer-check";
import { GiveawaySection } from "@/components/giveaway-section";
import { DropClock } from "@/components/drop-clock";
import { ItemCard } from "@/components/item-card";
import { saveBuyerFit, startBuyerVerified, signOutSeller } from "@/lib/actions";
import { fitAgainst, isCloseFit, isFutureDrop } from "@/lib/fit";
import { measuredRack, upcomingDrops } from "@/lib/queries";
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
  const sizesFlag = typeof params.sizes === "string" ? params.sizes : null;
  const hasSizes = Boolean(buyer.chest_in || buyer.waist_in || buyer.inseam_in || buyer.shoe_size);
  const [rack, drops] = hasSizes
    ? await Promise.all([measuredRack(40), upcomingDrops(12)])
    : [[], []];
  const closeRack = rack.filter((item) => isCloseFit(fitAgainst(buyer, item))).slice(0, 4);
  const closeDrops = drops.filter((item) => isCloseFit(fitAgainst(buyer, item))).slice(0, 4);

  return (
    <div className="wrap max-w-3xl py-12">
      <p className="eyebrow-pill">Your account</p>
      <div className="mt-3 flex items-center gap-3">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">{buyer.name}</h1>
        {verified && <BuyerCheck className="h-7 w-7" />}
      </div>
      <p className="mt-2 break-anywhere text-sm text-ink-soft">{buyer.email}</p>

      {notice && (
        <p className="mt-6 rounded-2xl bg-kelp/10 px-4 py-3 text-sm">{notice}</p>
      )}
      {sizesFlag === "saved" && (
        <p className="mt-6 rounded-2xl bg-kelp/10 px-4 py-3 text-sm">Sizes saved. Listings can now say if they are close.</p>
      )}
      {sizesFlag === "bad" && (
        <p className="mt-6 rounded-2xl bg-coral/10 px-4 py-3 text-sm">Measurements are inches, from 1 to 80.</p>
      )}

      <GiveawaySection className="mt-8" />

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

      <section className="panel mt-8 p-6">
        <h2 className="font-display text-xl font-bold">Your sizes</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Chest, waist, and inseam in inches, plus shoe size. Saved once.
          A listing that published the same measurement says if it is close, a bit off, or likely the wrong size.
        </p>
        <form action={saveBuyerFit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase">Chest (in)</span>
            <input name="chest_in" inputMode="decimal" defaultValue={buyer.chest_in ?? ""} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase">Waist (in)</span>
            <input name="waist_in" inputMode="decimal" defaultValue={buyer.waist_in ?? ""} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase">Inseam (in)</span>
            <input name="inseam_in" inputMode="decimal" defaultValue={buyer.inseam_in ?? ""} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase">Shoe size</span>
            <input name="shoe_size" defaultValue={buyer.shoe_size ?? ""} placeholder="9.5" className="field" />
          </label>
          <div className="sm:col-span-2">
            <button className="btn btn-ink w-full sm:w-auto">Save sizes</button>
          </div>
        </form>
      </section>

      {closeDrops.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">Drops close to you</h2>
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-8">
            {closeDrops.map((item) => (
              <div key={item.id}>
                <ItemCard item={item} note={fitAgainst(buyer, item)} />
                {item.drops_at && isFutureDrop(item.drops_at) && (
                  <div className="mt-2">
                    <DropClock at={item.drops_at} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {closeRack.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">For sale in your size</h2>
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-8">
            {closeRack.map((item) => (
              <ItemCard key={item.id} item={item} note={fitAgainst(buyer, item)} />
            ))}
          </div>
          <Link href="/shop" className="mt-4 inline-block text-sm font-semibold underline">
            Shop everything
          </Link>
        </section>
      )}

      <form action={signOutSeller} className="mt-6">
        <button className="text-sm font-semibold text-ink-faint underline">Sign out</button>
      </form>
    </div>
  );
}
