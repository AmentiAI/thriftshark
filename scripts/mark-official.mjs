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

await sql.query(`
  alter table sellers
    add column if not exists official boolean not null default false
`);

await sql.query(`
  create index if not exists sellers_official_idx
    on sellers (official)
    where official
`);

const updated = await sql.query(
  `update sellers
   set official = true, updated_at = now()
   where handle = $1
   returning id, handle, shop_name, official`,
  ["thriftsharks"],
);

console.log(JSON.stringify(updated, null, 2));
