import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const categories = [
  ["jackets", "Jackets & Outerwear", "Denim, leather, bombers and one serious trench."],
  ["tops", "Tops & Tees", "Band tees, flannels, knits and the occasional oddity."],
  ["denim", "Denim", "Straight, baggy, carpenter. All measured, no guessing."],
  ["dresses", "Dresses", "Day dresses, slips and a few showstoppers."],
  ["shoes", "Shoes", "Broken in, not broken down."],
  ["accessories", "Accessories", "Bags, belts, scarves, sunglasses, small treasures."],
  ["home", "Home & Oddities", "Glassware, lamps, ashtrays with opinions."],
];

const items = [
  ["jackets", "Levi's Type III Denim Trucker", 6800, 9500, "Levi's", "M", "excellent", "Indigo", true,
   "The one everybody asks about. Medium indigo wash with honest fading at the elbows and a soft, worn-in collar. All six buttons original, no repairs, no smell. Chest 42in, length 24in."],
  ["jackets", "Brown Leather Bomber, 1980s", 14500, null, "Unbranded", "L", "good", "Chestnut", true,
   "Heavy chestnut cowhide that has gone properly buttery. Quilted lining intact, zip runs smooth. One small scuff on the right cuff pictured. Shoulders 19in, chest 46in."],
  ["jackets", "Olive Military Field Coat", 7200, null, "Alpha Industries", "M", "good", "Olive", false,
   "Four pocket field coat with a drawcord waist. Faint paint fleck on the left sleeve, otherwise clean. Lining has no tears."],
  ["jackets", "Cropped Corduroy Chore Coat", 5400, 7000, "Dickies", "S", "excellent", "Tan", false,
   "Tan wide-wale cord, cropped at the hip. Barely worn. Two patch pockets, metal buttons all present."],
  ["tops", "Faded Tour Tee, 1994", 8800, null, "Unbranded", "L", "good", "Black", true,
   "Single stitch, paper-thin in the best way. Graphic is cracked but fully legible. Pit to pit 22in, length 28in. One pinhole near the hem, photographed."],
  ["tops", "Heavy Flannel, Red Buffalo Check", 3600, null, "Woolrich", "XL", "excellent", "Red", false,
   "Thick brushed cotton that still has body. No pilling, no missing buttons. Runs generous."],
  ["tops", "Cream Cable Knit Fisherman Sweater", 5200, 6800, "Aran", "M", "excellent", "Cream", true,
   "Proper wool, hand-framed cables, zero moth damage. Smells like nothing, which is the goal."],
  ["tops", "Striped Rugby, Navy and White", 3200, null, "Unbranded", "L", "good", "Navy", false,
   "Twill collar a little soft at the points. Cotton is still heavy. Great under a jacket."],
  ["tops", "Silk Blouse, Hand-Painted Floral", 4200, null, "Unbranded", "S", "excellent", "Ivory", false,
   "Real silk, covered buttons, French darts. No pulls or stains. Light enough for summer."],
  ["denim", "Levi's 501 Straight, Dark Wash", 5800, 7500, "Levi's", "32x32", "excellent", "Dark Indigo", true,
   "Measured flat: waist 32in, inseam 32in, rise 11in. Button fly, redline-free, barely faded."],
  ["denim", "Baggy Carpenter Jeans, Light Wash", 4800, null, "Dickies", "36x30", "good", "Light Blue", false,
   "Hammer loop intact, knees lightly sanded from real work. Waist 36in, inseam 30in."],
  ["denim", "High-Rise Mom Jeans", 4400, 5900, "Wrangler", "28x28", "excellent", "Mid Blue", false,
   "Tapered leg, 12in rise, sits at the natural waist. Hem never cut."],
  ["denim", "Black Denim Jacket-Matching Jeans", 5200, null, "Lee", "34x32", "good", "Faded Black", false,
   "Soft faded black with grey whiskering. Small repair inside the left pocket bag, not visible worn."],
  ["dresses", "1970s Floral Prairie Dress", 7800, null, "Unbranded", "S", "excellent", "Butter Yellow", true,
   "Tiered cotton with a corded waist tie and covered buttons up the back. Fully lined bodice, hem never shortened."],
  ["dresses", "Black Bias-Cut Slip Dress", 5600, 7200, "Unbranded", "M", "excellent", "Black", false,
   "Hangs beautifully, adjustable straps, no snags in the satin. Midi length."],
  ["dresses", "Red Polka Dot Swing Dress", 6200, null, "Unbranded", "M", "good", "Red", false,
   "Side metal zip runs clean. Tiny mend at the left underarm, done well and nearly invisible."],
  ["shoes", "Dr. Martens 1460, Cherry Red", 8400, 11000, "Dr. Martens", "9 US", "good", "Cherry Red", true,
   "Broken in exactly right. Soles have even wear with plenty of tread left, welt stitching fully intact. New laces included."],
  ["shoes", "White Leather Court Sneakers", 4600, null, "Adidas", "10 US", "good", "White", false,
   "Cleaned and deodorized. Light creasing at the toe box, no separation anywhere."],
  ["shoes", "Tan Western Boots, Stacked Heel", 9800, null, "Frye", "7.5 US", "excellent", "Tan", false,
   "Barely worn, leather soles almost unmarked. Pull straps tight, no cracking at the vamp."],
  ["accessories", "Leather Tote, Patina'd Cognac", 7400, 9200, "Coach", "One Size", "good", "Cognac", true,
   "Glove-tanned leather with the patina you cannot fake. Interior clean, zip pull original, creed patch readable."],
  ["accessories", "Woven Leather Belt, Brass Buckle", 2800, null, "Unbranded", "34in", "excellent", "Brown", false,
   "Full grain, no cracked weave, solid brass buckle with a light tarnish."],
  ["accessories", "Silk Scarf, Geometric Print", 2200, null, "Unbranded", "One Size", "excellent", "Teal", false,
   "Hand-rolled edges, colors still saturated. 34in square."],
  ["accessories", "Tortoise Shell Sunglasses", 3400, null, "Unbranded", "One Size", "good", "Tortoise", false,
   "Frames tight, hinges firm. Lenses have faint surface marks that do not show when worn."],
  ["home", "Amber Glass Decanter Set", 4800, null, null, "One Size", "excellent", "Amber", false,
   "Decanter plus four tumblers, no chips or cloudiness. Stopper seats properly."],
  ["home", "Brass Mushroom Table Lamp", 8600, 10500, null, "One Size", "good", "Brass", true,
   "Rewired with a new cord and plug, tested working. Shade has an even patina, no dents."],
  ["home", "Stack of Hardcover Novels, Set of 6", 2400, null, null, "One Size", "good", "Mixed", false,
   "Mid-century cloth bindings, spines all intact. Sold as the pictured set."],
];

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

await sql`delete from order_items`;
await sql`delete from orders`;
await sql`delete from item_images`;
await sql`delete from items`;
await sql`delete from categories`;

for (const [i, [slug, name, blurb]] of categories.entries()) {
  await sql`insert into categories (slug, name, blurb, sort_order)
            values (${slug}, ${name}, ${blurb}, ${i})`;
}

const catIds = Object.fromEntries(
  (await sql`select id, slug from categories`).map((r) => [r.slug, r.id]),
);

let n = 0;
for (const [cat, title, price, compare, brand, size, condition, color, featured, description] of items) {
  const slug = slugify(title);
  const [item] = await sql`
    insert into items (slug, title, description, price_cents, compare_at_cents,
                       category_id, brand, item_size, condition, color, status, featured,
                       created_at)
    values (${slug}, ${title}, ${description}, ${price}, ${compare},
            ${catIds[cat]}, ${brand}, ${size}, ${condition}, ${color}, 'available', ${featured},
            now() - (${n} * interval '7 hours'))
    returning id`;

  // Placeholder photography keyed to the slug so each item keeps a stable image.
  for (let p = 0; p < 3; p++) {
    await sql`insert into item_images (item_id, url, alt, position)
              values (${item.id},
                      ${`https://picsum.photos/seed/${slug}-${p}/900/1200`},
                      ${`${title} — view ${p + 1}`}, ${p})`;
  }
  n++;
}

// A couple already sold, so the "sold" state is visible in the UI.
await sql`update items set status = 'sold' where slug in ('striped-rugby-navy-and-white', 'silk-scarf-geometric-print')`;

const counts = await sql`
  select (select count(*) from categories) as categories,
         (select count(*) from items) as items,
         (select count(*) from item_images) as images`;
console.log("Seeded:", counts[0]);
