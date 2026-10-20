import { readFileSync } from "node:fs";
import { put, del } from "@vercel/blob";

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

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("no token");
  process.exit(1);
}

const blob = await put(
  `test/ping-${Date.now()}.txt`,
  "thriftsharks blob ok",
  { access: "public", contentType: "text/plain", token },
);
console.log("uploaded", blob.url);
await del(blob.url, { token });
console.log("deleted ok");
