export type Category = {
  id: number;
  slug: string;
  name: string;
  blurb: string | null;
  sort_order: number;
};

export type ItemImage = {
  url: string;
  alt: string | null;
};

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

export type ItemStatus = "draft" | "available" | "reserved" | "sold";

export const CONDITIONS: { value: Condition; label: string }[] = [
  { value: "new-with-tags", label: "New with tags" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "worn", label: "Well worn" },
];

export const STATUSES: ItemStatus[] = ["draft", "available", "reserved", "sold"];

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

export const SHIPPING_FLAT_CENTS = 800;
export const FREE_SHIPPING_THRESHOLD_CENTS = 15000;

export function shippingFor(subtotalCents: number, fulfilment: "ship" | "pickup") {
  if (fulfilment === "pickup" || subtotalCents === 0) return 0;
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_CENTS;
}
