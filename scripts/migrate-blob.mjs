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
  alter table images
    add column if not exists blob_url text,
    alter column bytes drop not null
`);

await sql.query(`
  alter table item_images
    alter column url set default ''
`);

await sql.query(`
  alter table item_images
    alter column url drop not null
`);

console.log("blob image columns ready");
