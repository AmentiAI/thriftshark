/** Platform seller plan — billed on the Thrift Sharks Stripe account. */

export const SELLER_PLAN_PRICE_USD = 20;

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
}): boolean {
  if (seller.verified === true || seller.official === true) return true;
  const status = seller.subscription_status ?? "none";
  return status === "active" || status === "trialing";
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

export function sellerPlanConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && sellerPlanPriceId());
}
