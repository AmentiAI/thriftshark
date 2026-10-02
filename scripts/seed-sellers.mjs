/**
 * Demo marketplace data: four shops that own the seeded inventory, each with a
 * generated Cash App code. Re-runnable; it replaces the demo shops only.
 */
import { randomBytes, scryptSync } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import QRCode from "qrcode";

const sql = neon(process.env.DATABASE_URL);

const PASSWORD = "sharkdemo123";

const SHOPS = [
  {
    handle: "harbour-road",
    shop_name: "Harbour Road Vintage",
    email: "harbour@example.com",
    cashapp_tag: "harbourroad",
    tagline: "Workwear, denim and outerwear, mostly 70s and 80s.",
    location: "Portland, OR",
    featured: true,
    bio: "Two of us, one van, and a storage unit we are slowly emptying. Everything is washed, measured flat in inches and photographed in daylight. Ask for any measurement you need and you will have it the same day.",
    categories: ["jackets", "denim"],
  },
  {
    handle: "saltwater-supply",
    shop_name: "Saltwater Supply Co.",
    email: "saltwater@example.com",
    cashapp_tag: "saltwatersupply",
    tagline: "Tees, flannels and knits with the wear already done for you.",
    location: "Oakland, CA",
    featured: true,
    bio: "I buy by the bale and keep maybe one piece in thirty. Single stitch tees, heavy flannels, real wool knits. If it has a pinhole I photograph the pinhole.",
    categories: ["tops"],
  },
  {
    handle: "the-good-hanger",
    shop_name: "The Good Hanger",
    email: "hanger@example.com",
    cashapp_tag: "goodhanger",
    tagline: "Dresses and shoes, hunted one closet at a time.",
    location: "Austin, TX",
    featured: false,
    bio: "Estate sales and church basements, every weekend. I specialise in day dresses and boots that have been broken in properly. Everything ships in two days, wrapped in tissue.",
    categories: ["dresses", "shoes"],
  },
  {
    handle: "fin-and-found",
    shop_name: "Fin & Found",
    email: "fin@example.com",
    cashapp_tag: "finandfound",
    tagline: "Bags, belts, glassware and lamps that deserve a second room.",
    location: "Providence, RI",
    featured: false,
    bio: "Accessories and household oddities. Brass, amber glass, leather with the patina you cannot fake. Rewired every lamp myself and tested it before listing.",
    categories: ["accessories", "home"],
  },
];

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

async function storeQr(cashtag, sellerId) {
  const png = await QRCode.toBuffer(`https://cash.app/$${cashtag}`, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 640,
    color: { dark: "#0c1b2aff", light: "#ffffffff" },
  });
  const rows = await sql.query(
    `insert into images (seller_id, mime, bytes, byte_size, purpose)
     values ($1, 'image/png', $2, $3, 'cashapp-qr') returning id`,
    [sellerId, png, png.byteLength],
  );
  return rows[0].id;
}

const handles = SHOPS.map((s) => s.handle);

// Clear only the demo shops, so a real signup is never touched.
await sql.query(`delete from sellers where handle = any($1::text[])`, [handles]);

const categories = Object.fromEntries(
  (await sql`select id, slug from categories`).map((r) => [r.slug, r.id]),
);

for (const shop of SHOPS) {
  const rows = await sql`
    insert into sellers (handle, shop_name, email, password_hash, tagline, bio,
                         location, cashapp_tag, featured, status)
    values (${shop.handle}, ${shop.shop_name}, ${shop.email}, ${hashPassword(PASSWORD)},
            ${shop.tagline}, ${shop.bio}, ${shop.location}, ${shop.cashapp_tag},
            ${shop.featured}, 'active')
    returning id`;
  const sellerId = rows[0].id;

  const qrId = await storeQr(shop.cashapp_tag, sellerId);
  await sql`update sellers set qr_image_id = ${qrId} where id = ${sellerId}`;

  const categoryIds = shop.categories.map((slug) => categories[slug]).filter(Boolean);
  await sql.query(
    `update items set seller_id = $1
     where category_id = any($2::int[]) and seller_id is distinct from $1`,
    [sellerId, categoryIds],
  );
  const count = await sql`select count(*)::int as n from items where seller_id = ${sellerId}`;
  console.log(`${shop.shop_name.padEnd(24)} /shop/${shop.handle.padEnd(18)} ${count[0].n} listings`);
}

// Anything left over goes to the first shop so nothing is orphaned.
const orphans = await sql`select count(*)::int as n from items where seller_id is null`;
if (orphans[0].n > 0) {
  const first = await sql`select id from sellers where handle = ${handles[0]}`;
  await sql`update items set seller_id = ${first[0].id} where seller_id is null`;
  console.log(`\n${orphans[0].n} unassigned listings given to ${SHOPS[0].shop_name}`);
}

const totals = await sql`
  select (select count(*)::int from sellers) shops,
         (select count(*)::int from items where seller_id is not null) owned,
         (select count(*)::int from images) images`;
console.log(`\nSeeded:`, totals[0]);
console.log(`Demo shop password: ${PASSWORD}`);
