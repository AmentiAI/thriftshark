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
console.log("items", await sql.query(`select id, slug, seller_id, status from items order by id desc limit 5`));
console.log("images", await sql.query(`select id, seller_id, purpose, byte_size, length(bytes) as blen from images order by id desc limit 5`));
console.log("item_images count", await sql.query(`select count(*)::int as n from item_images`));
