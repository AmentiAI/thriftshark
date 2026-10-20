/**
 * Thrift Sharks brand tokens — keep Stripe Checkout / Connect in sync with
 * `app/globals.css` (@theme).
 */
export const BRAND = {
  name: "Thrift Sharks",
  shortName: "Thrift Sharks",
  /** Primary blue (reef) */
  primary: "#0066ff",
  /** Near-black (void) */
  ink: "#0a0a0a",
  /** Page white (paper) */
  paper: "#ffffff",
  supportEmail: "support@thriftsharks.com",
  supportUrlPath: "/contact",
  productDescription:
    "Online marketplace for one-of-one secondhand clothing. Independent sellers ship to buyers.",
} as const;

export function checkoutDisplayName(shopName: string | null | undefined) {
  const shop = shopName?.trim();
  if (!shop) return BRAND.name;
  return `${shop} · ${BRAND.name}`;
}
