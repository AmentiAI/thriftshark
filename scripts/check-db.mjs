import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (!process.env[m[1]]) process.env[m[1]] = v;
}

const sql = neon(process.env.DATABASE_URL);

const cols = await sql.query(`
  select column_name
  from information_schema.columns
  where table_schema = 'public' and table_name = 'sellers'
    and column_name in (
      'official', 'subscription_status', 'stripe_customer_id',
      'stripe_subscription_id', 'subscription_current_period_end'
    )
  order by 1
`);
console.log("seller columns:", cols);

try {
  const probe = await sql.query(`
    select id, handle,
      (official or subscription_status in ('active', 'trialing')) as verified
    from sellers limit 3
  `);
  console.log("verified probe ok:", probe);
} catch (e) {
  console.error("verified probe FAILED:", e.message);
}

try {
  const items = await sql.query(`
    select i.id, i.slug
    from items i
    join sellers s on s.id = i.seller_id and s.status = 'active'
    where i.status = 'available'
    order by (s.official or s.subscription_status in ('active', 'trialing')) desc
    limit 1
  `);
  console.log("item sort probe ok:", items);
} catch (e) {
  console.error("item sort probe FAILED:", e.message);
}
