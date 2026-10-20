import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (!m || m[1].startsWith("#")) continue;
  let v = m[2].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (!process.env[m[1]]) process.env[m[1]] = v;
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = neon(url);

await sql.query(`
  alter table sellers
    add column if not exists stripe_customer_id text unique,
    add column if not exists stripe_subscription_id text unique,
    add column if not exists subscription_status text not null default 'none',
    add column if not exists subscription_current_period_end timestamptz
`);

await sql.query(`
  create index if not exists sellers_subscription_idx
    on sellers (subscription_status)
    where subscription_status in ('active', 'trialing')
`);

console.log("seller plan columns ready");
