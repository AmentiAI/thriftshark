/**
 * Clears every demo and test record so the marketplace opens empty for real
 * sellers: shops, listings, photos, orders, auctions, bids, messages, DMs and
 * newsletter sign-ups. Categories stay — they are the shop's taxonomy, not data.
 *
 * Dry run by default; prints what it would delete. Pass --yes to do it.
 *   npm run db:reset                        # counts only
 *   npm run db:reset -- --yes               # wipe everything
 *   npm run db:reset -- --demo-only --yes   # remove only the seeded shops
 *
 * --demo-only removes every shop on an @example.com address (what the seed
 * scripts create) with their listings, lots, orders and DMs, plus any stored
 * image nothing points at. Real shops are untouched.
 */
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Children before parents, so nothing is left dangling mid-way.
const TABLES = [
  "dm_messages",
  "dm_threads",
  "bids",
  "auctions",
  "order_items",
  "orders",
  "item_images",
  "messages",
  "items",
  "sellers",
  "images",
  "subscribers",
];

const host = (() => {
  try {
    return new URL(process.env.DATABASE_URL).host;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
})();

console.log(`Database: ${host}\n`);
for (const table of TABLES) {
  const [{ n }] = await sql.query(`select count(*)::int as n from ${table}`);
  console.log(`${String(n).padStart(7)}  ${table}`);
}
const [{ n: categories }] = await sql.query(`select count(*)::int as n from categories`);
console.log(`${String(categories).padStart(7)}  categories (kept)\n`);

if (process.argv.includes("--demo-only")) {
  const demo = await sql`select id, handle from sellers where email ilike '%@example.com' order by id`;
  console.log(`Demo shops: ${demo.map((s) => s.handle).join(", ") || "none"}`);
  if (!process.argv.includes("--yes")) {
    console.log("Dry run. Re-run with --yes to delete them.");
    process.exit(0);
  }
  const ids = demo.map((s) => s.id);
  await sql.transaction([
    // Orders only lose their shop when it goes, so take them out first.
    sql`delete from orders where seller_id = any(${ids}::int[])`,
    sql`delete from sellers where id = any(${ids}::int[])`,
    sql`delete from items where seller_id is null`,
    sql`delete from images im
        where not exists (select 1 from sellers s where s.id = im.seller_id)
          and not exists (select 1 from item_images ii where ii.image_id = im.id)
          and not exists (select 1 from sellers s
                          where im.id in (s.logo_image_id, s.banner_image_id, s.qr_image_id))`,
    sql`delete from subscribers where email ilike '%@example.com'`,
    sql`delete from messages where email ilike '%@example.com'`,
  ]);
  console.log(`Removed ${ids.length} demo shop${ids.length === 1 ? "" : "s"}.`);
  process.exit(0);
}

if (!process.argv.includes("--yes")) {
  console.log("Dry run. Re-run with --yes to delete all of the above.");
  process.exit(0);
}

// One statement, so it either all goes or none of it does. Restarting the
// sequences means the first real order is #1, not #27.
await sql.query(`truncate ${TABLES.join(", ")} restart identity cascade`);
console.log("Cleared. The marketplace is empty and ready for real shops.");
