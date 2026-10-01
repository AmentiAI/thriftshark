"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { createOrder } from "@/lib/orders";
import { endSession, passwordMatches, requireAdmin, startSession } from "@/lib/auth";
import { STATUSES, CONDITIONS } from "@/lib/types";

export type FormState = { error?: string; ok?: string } | null;

const text = (v: FormDataEntryValue | null) =>
  typeof v === "string" ? v.trim() : "";
const optional = (v: FormDataEntryValue | null) => text(v) || null;

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

/* ---------- storefront ---------- */

const checkoutSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  customer_name: z.string().min(2, "Tell us your name."),
  phone: z.string().nullable(),
  fulfilment: z.enum(["ship", "pickup"]),
  address_line1: z.string().nullable(),
  address_line2: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  postal_code: z.string().nullable(),
  country: z.string().nullable(),
  notes: z.string().nullable(),
});

export async function placeOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const ids = text(formData.get("item_ids"))
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);

  const parsed = checkoutSchema.safeParse({
    email: text(formData.get("email")),
    customer_name: text(formData.get("customer_name")),
    phone: optional(formData.get("phone")),
    fulfilment: text(formData.get("fulfilment")) === "pickup" ? "pickup" : "ship",
    address_line1: optional(formData.get("address_line1")),
    address_line2: optional(formData.get("address_line2")),
    city: optional(formData.get("city")),
    region: optional(formData.get("region")),
    postal_code: optional(formData.get("postal_code")),
    country: optional(formData.get("country")),
    notes: optional(formData.get("notes")),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const details = parsed.data;
  if (details.fulfilment === "ship" && (!details.address_line1 || !details.city || !details.postal_code)) {
    return { error: "We need a street address, city and postcode to ship." };
  }

  const result = await createOrder(ids, details);
  if (!result.ok) return { error: result.error };

  revalidatePath("/shop");
  redirect(`/order/${result.orderNumber}`);
}

const contactSchema = z.object({
  name: z.string().min(2, "Tell us your name."),
  email: z.string().email("Enter a valid email address."),
  subject: z.string().nullable(),
  body: z.string().min(10, "Add a little more detail so we can help."),
});

export async function sendMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse({
    name: text(formData.get("name")),
    email: text(formData.get("email")),
    subject: optional(formData.get("subject")),
    body: text(formData.get("body")),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const itemId = Number(text(formData.get("item_id")));
  await sql`
    insert into messages (name, email, subject, body, item_id)
    values (${parsed.data.name}, ${parsed.data.email}, ${parsed.data.subject},
            ${parsed.data.body}, ${Number.isInteger(itemId) && itemId > 0 ? itemId : null})
  `;
  return { ok: "Message sent. We usually reply within a day." };
}

export async function subscribe(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData.get("email")).toLowerCase();
  if (!z.string().email().safeParse(email).success) {
    return { error: "That email does not look right." };
  }
  await sql`insert into subscribers (email) values (${email}) on conflict (email) do nothing`;
  return { ok: "You're on the list. New drops hit your inbox first." };
}

/* ---------- admin auth ---------- */

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = text(formData.get("password"));
  if (!password || !passwordMatches(password)) {
    return { error: "Wrong password." };
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

/* ---------- admin: items ---------- */

const itemSchema = z.object({
  title: z.string().min(2, "An item needs a title."),
  description: z.string(),
  price_cents: z.number().int().min(0, "Price cannot be negative."),
  compare_at_cents: z.number().int().min(0).nullable(),
  category_id: z.number().int().nullable(),
  brand: z.string().nullable(),
  item_size: z.string().nullable(),
  condition: z.enum(CONDITIONS.map((c) => c.value) as [string, ...string[]]),
  color: z.string().nullable(),
  status: z.enum(STATUSES as [string, ...string[]]),
  featured: z.boolean(),
});

/** "38.50" or "38,50" or "$38.50" -> 3850 */
function toCents(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.,-]/g, "").replace(",", ".");
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

function readItemForm(formData: FormData) {
  const price = toCents(text(formData.get("price")));
  const compareRaw = text(formData.get("compare_at"));
  const categoryRaw = text(formData.get("category_id"));

  return itemSchema.safeParse({
    title: text(formData.get("title")),
    description: text(formData.get("description")),
    price_cents: price ?? -1,
    compare_at_cents: compareRaw ? toCents(compareRaw) : null,
    category_id: categoryRaw ? Number(categoryRaw) : null,
    brand: optional(formData.get("brand")),
    item_size: optional(formData.get("item_size")),
    condition: text(formData.get("condition")) || "good",
    color: optional(formData.get("color")),
    status: text(formData.get("status")) || "available",
    featured: formData.get("featured") === "on",
  });
}

function readImageUrls(formData: FormData) {
  return text(formData.get("image_urls"))
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//.test(s))
    .slice(0, 8);
}

async function uniqueSlug(title: string, ignoreId?: number) {
  const base = slugify(title) || "item";
  for (let n = 0; n < 50; n++) {
    const candidate = n === 0 ? base : `${base}-${n + 1}`;
    const clash = (await sql.query(
      `select 1 from items where slug = $1 and ($2::int is null or id <> $2::int) limit 1`,
      [candidate, ignoreId ?? null],
    )) as unknown[];
    if (clash.length === 0) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function createItem(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = readItemForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const slug = await uniqueSlug(d.title);
  const rows = (await sql`
    insert into items (slug, title, description, price_cents, compare_at_cents, category_id,
                       brand, item_size, condition, color, status, featured)
    values (${slug}, ${d.title}, ${d.description}, ${d.price_cents}, ${d.compare_at_cents},
            ${d.category_id}, ${d.brand}, ${d.item_size}, ${d.condition}, ${d.color},
            ${d.status}, ${d.featured})
    returning id
  `) as { id: number }[];

  const id = rows[0].id;
  const urls = readImageUrls(formData);
  for (const [position, url] of urls.entries()) {
    await sql`insert into item_images (item_id, url, alt, position)
              values (${id}, ${url}, ${d.title}, ${position})`;
  }

  revalidatePath("/shop");
  revalidatePath("/");
  redirect(`/admin/items/${id}?saved=1`);
}

export async function updateItem(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(text(formData.get("id")));
  if (!Number.isInteger(id) || id <= 0) return { error: "Unknown item." };

  const parsed = readItemForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const slug = await uniqueSlug(d.title, id);
  await sql`
    update items set
      slug = ${slug}, title = ${d.title}, description = ${d.description},
      price_cents = ${d.price_cents}, compare_at_cents = ${d.compare_at_cents},
      category_id = ${d.category_id}, brand = ${d.brand}, item_size = ${d.item_size},
      condition = ${d.condition}, color = ${d.color}, status = ${d.status},
      featured = ${d.featured}, updated_at = now()
    where id = ${id}
  `;

  const urls = readImageUrls(formData);
  if (urls.length > 0) {
    await sql`delete from item_images where item_id = ${id}`;
    for (const [position, url] of urls.entries()) {
      await sql`insert into item_images (item_id, url, alt, position)
                values (${id}, ${url}, ${d.title}, ${position})`;
    }
  }

  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath(`/item/${slug}`);
  return { ok: "Saved." };
}

export async function deleteItem(formData: FormData) {
  await requireAdmin();
  const id = Number(text(formData.get("id")));
  if (Number.isInteger(id) && id > 0) {
    await sql`delete from items where id = ${id}`;
  }
  revalidatePath("/shop");
  redirect("/admin/items");
}

export async function setItemStatus(formData: FormData) {
  await requireAdmin();
  const id = Number(text(formData.get("id")));
  const status = text(formData.get("status"));
  if (Number.isInteger(id) && id > 0 && (STATUSES as string[]).includes(status)) {
    await sql`update items set status = ${status}, updated_at = now() where id = ${id}`;
  }
  revalidatePath("/admin/items");
  revalidatePath("/shop");
}

/* ---------- admin: orders & messages ---------- */

export async function setOrderStatus(formData: FormData) {
  await requireAdmin();
  const id = Number(text(formData.get("id")));
  const status = text(formData.get("status"));
  const payment = text(formData.get("payment_status"));

  if (!Number.isInteger(id) || id <= 0) return;
  if (["new", "packed", "shipped", "picked-up", "cancelled"].includes(status)) {
    await sql`update orders set status = ${status} where id = ${id}`;
  }
  if (["pending", "paid", "refunded"].includes(payment)) {
    await sql`update orders set payment_status = ${payment} where id = ${id}`;
  }
  revalidatePath("/admin/orders");
}

export async function toggleMessageHandled(formData: FormData) {
  await requireAdmin();
  const id = Number(text(formData.get("id")));
  if (Number.isInteger(id) && id > 0) {
    await sql`update messages set handled = not handled where id = ${id}`;
  }
  revalidatePath("/admin/messages");
}
