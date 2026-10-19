import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "shark_buyer";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function valid(value: string | undefined) {
  return !!value && /^[a-f0-9]{64}$/.test(value);
}

/** The browser's inbox key, or null when this visitor has never messaged. */
export async function currentBuyerKey(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  return valid(value) ? value! : null;
}

/** Keep the existing key, or mint one and store it. */
export async function ensureBuyerKey(): Promise<string> {
  const existing = await currentBuyerKey();
  if (existing) return existing;

  const key = randomBytes(32).toString("hex");
  (await cookies()).set(COOKIE, key, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return key;
}
