export type Category = {
  id: number;
  slug: string;
  name: string;
  blurb: string | null;
  sort_order: number;
};

export type ItemImage = {
  /** The item_images row. Absent on images built outside a query. */
  id?: number;
  url: string | null;
  image_id: number | null;
  alt: string | null;
};

export type Seller = {
  id: number;
  handle: string;
  shop_name: string;
  email: string;
  password_hash: string;
  tagline: string | null;
  bio: string | null;
  location: string | null;
  cashapp_tag: string | null;
  logo_image_id: number | null;
  banner_image_id: number | null;
  qr_image_id: number | null;
  qr_is_custom: boolean;
  banner_x: number;
  banner_y: number;
  logo_x: number;
  logo_y: number;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  subscription_current_period_end: string | null;
  /** Platform shop — Verified without a paid plan. */
  official: boolean;
  status: "active" | "suspended";
  featured: boolean;
  created_at: string;
  updated_at: string;
};

/** A shop as the storefront shows it: no credentials, plus live counts. */
export type SellerCard = {
  id: number;
  handle: string;
  shop_name: string;
  tagline: string | null;
  bio: string | null;
  location: string | null;
  logo_image_id: number | null;
  banner_image_id: number | null;
  banner_x: number;
  banner_y: number;
  logo_x: number;
  logo_y: number;
  featured: boolean;
  /** Active $20/mo Verified plan. */
  verified: boolean;
  created_at: string;
  item_count: number;
  sold_count: number;
};

/** Paid-order leaderboard row for the current calendar week. */
export type WeeklyTopShop = {
  id: number;
  handle: string;
  shop_name: string;
  logo_image_id: number | null;
  logo_x: number;
  logo_y: number;
  sales_count: number;
};

/** Everything the storefront settings form needs — never the password hash. */
export type ShopSettings = {
  id: number;
  handle: string;
  shop_name: string;
  email: string;
  tagline: string | null;
  bio: string | null;
  location: string | null;
  logo_image_id: number | null;
  banner_image_id: number | null;
  banner_x: number;
  banner_y: number;
  logo_x: number;
  logo_y: number;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  subscription_status: string;
  subscription_current_period_end: string | null;
  official: boolean;
  verified: boolean;
};

/** CSS object-position for a banner or profile photo. 50, 50 is the centre. */
export function focalStyle(x: number | null | undefined, y: number | null | undefined) {
  return { objectPosition: `${x ?? 50}% ${y ?? 50}%` };
}

export function toShopSettings(seller: Seller): ShopSettings {
  const status = seller.subscription_status ?? "none";
  const official = Boolean(seller.official);
  const verified =
    official || status === "active" || status === "trialing";
  return {
    id: seller.id,
    handle: seller.handle,
    shop_name: seller.shop_name,
    email: seller.email,
    tagline: seller.tagline,
    bio: seller.bio,
    location: seller.location,
    logo_image_id: seller.logo_image_id,
    banner_image_id: seller.banner_image_id,
    banner_x: seller.banner_x ?? 50,
    banner_y: seller.banner_y ?? 50,
    logo_x: seller.logo_x ?? 50,
    logo_y: seller.logo_y ?? 50,
    stripe_account_id: seller.stripe_account_id ?? null,
    stripe_charges_enabled: Boolean(seller.stripe_charges_enabled),
    stripe_payouts_enabled: Boolean(seller.stripe_payouts_enabled),
    subscription_status: status,
    subscription_current_period_end: seller.subscription_current_period_end ?? null,
    official,
    verified,
  };
}

/** Resolves an item photo to a src, whether it was uploaded or linked. */
export function imageSrc(image: { url: string | null; image_id: number | null } | null | undefined) {
  if (!image) return null;
  // Prefer an absolute Blob (or other CDN) URL when present.
  if (image.url && /^https?:\/\//i.test(image.url)) return image.url;
  if (image.image_id) return `/api/images/${image.image_id}`;
  return image.url || null;
}

export type Item = {
  id: number;
  slug: string;
  title: string;
  description: string;
  price_cents: number;
  compare_at_cents: number | null;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  seller_id: number | null;
  seller_handle: string | null;
  seller_shop_name: string | null;
  seller_logo_image_id: number | null;
  seller_verified: boolean;
  brand: string | null;
  item_size: string | null;
  condition: Condition;
  color: string | null;
  status: ItemStatus;
  featured: boolean;
  created_at: string;
  images: ItemImage[];
};

export type Condition =
  | "new-with-tags"
  | "excellent"
  | "good"
  | "fair"
  | "worn";

export type ItemStatus = "draft" | "available" | "reserved" | "sold" | "auction";

export const CONDITIONS: { value: Condition; label: string }[] = [
  { value: "new-with-tags", label: "New with tags" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "worn", label: "Well worn" },
];

export const STATUSES: ItemStatus[] = [
  "draft",
  "available",
  "reserved",
  "sold",
  "auction",
];

/** The statuses a seller may set directly; "auction" comes from a live lot. */
export const SELLER_SETTABLE_STATUSES: ItemStatus[] = [
  "draft",
  "available",
  "reserved",
  "sold",
];

export const conditionLabel = (c: string) =>
  CONDITIONS.find((x) => x.value === c)?.label ?? c;

export type OrderLine = {
  id: number;
  item_id: number | null;
  title: string;
  price_cents: number;
  slug: string | null;
};

export type Order = {
  id: number;
  order_number: string;
  group_token: string | null;
  seller_id: number | null;
  seller_handle: string | null;
  seller_shop_name: string | null;
  seller_logo_image_id: number | null;
  seller_stripe_account_id: string | null;
  seller_stripe_charges_enabled: boolean;
  email: string;
  customer_name: string;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string;
  subtotal_cents: number;
  shipping_cents: number;
  platform_fee_cents: number;
  total_cents: number;
  fulfilment: "ship" | "pickup";
  status: "new" | "packed" | "shipped" | "picked-up" | "cancelled";
  payment_status: "pending" | "paid" | "refunded";
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  created_at: string;
  lines: OrderLine[];
};

export type DmSender = "buyer" | "seller";

export type DmMessage = {
  id: number;
  thread_id: number;
  sender: DmSender;
  body: string;
  created_at: string;
};

/** A conversation row for lists and headers. Never includes the buyer key. */
export type DmThread = {
  id: number;
  seller_id: number;
  item_id: number | null;
  buyer_name: string;
  buyer_email: string;
  created_at: string;
  updated_at: string;
  shop_name: string;
  handle: string;
  item_title: string | null;
  item_slug: string | null;
  last_body: string | null;
  last_sender: DmSender | null;
  message_count: number;
};

export type Message = {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  body: string;
  item_id: number | null;
  handled: boolean;
  created_at: string;
};

export type AuctionStatus = "live" | "ended" | "sold" | "cancelled";

export type Auction = {
  id: number;
  item_id: number;
  seller_id: number;
  start_cents: number;
  reserve_cents: number | null;
  increment_cents: number;
  starts_at: string;
  ends_at: string;
  status: AuctionStatus;
  settled_at: string | null;
  order_id: number | null;
  created_at: string;
  item_slug: string;
  item_title: string;
  item_description: string;
  item_brand: string | null;
  item_size: string | null;
  item_condition: Condition;
  seller_handle: string;
  seller_shop_name: string;
  seller_logo_image_id: number | null;
  seller_verified: boolean;
  bid_count: number;
  high_cents: number | null;
  high_bidder: string | null;
  images: ItemImage[];
};

/** Durations a seller can pick when putting a piece on the block. */
export const AUCTION_DURATIONS: { hours: number; label: string }[] = [
  { hours: 1, label: "1 hour — flash" },
  { hours: 6, label: "6 hours" },
  { hours: 24, label: "1 day" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "7 days" },
];

export const SHIPPING_FLAT_CENTS = 800;
export const FREE_SHIPPING_THRESHOLD_CENTS = 15000;

/** Flat platform fee charged to the buyer on every shop order ($5). */
export const PLATFORM_FEE_CENTS = 500;

export function shippingFor(subtotalCents: number, fulfilment: "ship" | "pickup") {
  if (fulfilment === "pickup" || subtotalCents === 0) return 0;
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_CENTS;
}

/** Platform fee for a checkout bag — $5 per shop (one Stripe charge each). */
export function platformFeeForShopCount(shopCount: number) {
  if (shopCount <= 0) return 0;
  return PLATFORM_FEE_CENTS * shopCount;
}
