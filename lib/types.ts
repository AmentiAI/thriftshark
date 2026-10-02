export type Category = {
  id: number;
  slug: string;
  name: string;
  blurb: string | null;
  sort_order: number;
};

export type ItemImage = {
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
  cashapp_tag: string | null;
  logo_image_id: number | null;
  banner_image_id: number | null;
  qr_image_id: number | null;
  featured: boolean;
  created_at: string;
  item_count: number;
  sold_count: number;
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
  cashapp_tag: string | null;
  logo_image_id: number | null;
  banner_image_id: number | null;
  qr_image_id: number | null;
  qr_is_custom: boolean;
};

export function toShopSettings(seller: Seller): ShopSettings {
  return {
    id: seller.id,
    handle: seller.handle,
    shop_name: seller.shop_name,
    email: seller.email,
    tagline: seller.tagline,
    bio: seller.bio,
    location: seller.location,
    cashapp_tag: seller.cashapp_tag,
    logo_image_id: seller.logo_image_id,
    banner_image_id: seller.banner_image_id,
    qr_image_id: seller.qr_image_id,
    qr_is_custom: seller.qr_is_custom,
  };
}

/** Resolves an item photo to a src, whether it was uploaded or linked. */
export function imageSrc(image: { url: string | null; image_id: number | null } | null | undefined) {
  if (!image) return null;
  if (image.image_id) return `/api/images/${image.image_id}`;
  return image.url ?? null;
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
  seller_cashapp_tag: string | null;
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
  seller_cashapp_tag: string | null;
  seller_qr_image_id: number | null;
  seller_logo_image_id: number | null;
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
  total_cents: number;
  fulfilment: "ship" | "pickup";
  status: "new" | "packed" | "shipped" | "picked-up" | "cancelled";
  payment_status: "pending" | "paid" | "refunded";
  notes: string | null;
  created_at: string;
  lines: OrderLine[];
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
  seller_cashapp_tag: string | null;
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

export function shippingFor(subtotalCents: number, fulfilment: "ship" | "pickup") {
  if (fulfilment === "pickup" || subtotalCents === 0) return 0;
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_CENTS;
}
