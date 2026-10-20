import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    // fall through
  }

  if (!sharp) {
    try {
      sharp = require("sharp");
    } catch {
      console.error("sharp not installed; copying full crest");
      const buf = readFileSync("public/crest.png");
      writeFileSync("app/icon.png", buf);
      writeFileSync("app/apple-icon.png", buf);
      return;
    }
  }

  const src = "public/crest.png";
  await sharp(src)
    .resize(64, 64, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile("app/icon.png");
  await sharp(src)
    .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile("app/apple-icon.png");
  console.log("wrote app/icon.png and app/apple-icon.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
