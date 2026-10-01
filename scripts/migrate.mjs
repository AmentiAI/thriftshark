import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");

// One statement per semicolon-terminated block; leading comment lines are stripped
// so a commented block still runs its DDL.
const statements = schema
  .split(/;\s*$/m)
  .map((block) =>
    block
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .trim(),
  )
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
  console.log("ok  " + statement.split("\n")[0].slice(0, 70));
}

console.log(`\nMigrated ${statements.length} statements.`);
