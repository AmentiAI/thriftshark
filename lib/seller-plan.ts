/** Platform seller plan — billed on the Thrift Sharks Stripe account. */

export const SELLER_PLAN_PRICE_USD = 20;

/** How long one Verified payment lasts before the badge drops. */
export const VERIFIED_PASS_DAYS = 30;

/** Warn this long before verified_until. */
export const VERIFIED_REMINDER_HOURS = 24;

/** Listing photo caps. Verified shops get more room for detail shots. */
export const FREE_LISTING_PHOTOS = 8;
export const VERIFIED_LISTING_PHOTOS = 20;

/** Live rack slots (available + auction). Verified is unlimited. */
export const FREE_MAX_LIVE_LISTINGS = 12;

/** Homepage / “Worth a look” pins a Verified shop can self-serve. */
export const VERIFIED_SPOTLIGHT_CAP = 3;

export type SubscriptionStatus =
  | "none"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete";

export function isSellerVerified(seller: {
  subscription_status?: string | null;
  verified?: boolean | null;
  official?: boolean | null;
  verified_until?: string | Date | null;
}): boolean {
  if (seller.official === true) return true;
  if (seller.verified_until) {
    const until = new Date(seller.verified_until).getTime();
    if (Number.isFinite(until) && until > Date.now()) return true;
  }
  // Shop cards set `verified` from SQL (official or verified_until > now()).
  if (seller.verified === true && !seller.verified_until) return true;
  return false;
}

export function listingPhotoLimit(verified: boolean) {
  return verified ? VERIFIED_LISTING_PHOTOS : FREE_LISTING_PHOTOS;
}

/** null = unlimited */
export function liveListingLimit(verified: boolean): number | null {
  return verified ? null : FREE_MAX_LIVE_LISTINGS;
}

export function sellerPlanPriceId() {
  return process.env.STRIPE_SELLER_PLAN_PRICE_ID?.trim() || null;
}

/** One-time $20 Checkout — does not need a Stripe Price id. */
export function sellerPlanConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
