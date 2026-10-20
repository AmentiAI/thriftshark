import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import type { Buyer } from "@/lib/types";

const COOKIE = "shark_account";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const BUYER_VERIFIED_PRICE_USD = 10;
export const BUYER_VERIFIED_DAYS = 30;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error("SESSION_SECRET must be set to at least 16 characters");
  }
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(`buyer.${payload}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function isBuyerVerified(buyer: { verified_until?: string | Date | null } | null) {
  if (!buyer?.verified_until) return false;
  const until = new Date(buyer.verified_until).getTime();
  return Number.isFinite(until) && until > Date.now();
}

export async function startBuyerSession(buyerId: number) {
  const payload = `${buyerId}.${Date.now() + MAX_AGE_SECONDS * 1000}`;
  const store = await cookies();
  store.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endBuyerSession() {
  (await cookies()).delete(COOKIE);
}

function readCookie(raw: string | undefined) {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [id, expires, signature] = parts;
  if (!safeEqual(signature, sign(`${id}.${expires}`))) return null;
  if (Number(expires) <= Date.now()) return null;
  const buyerId = Number(id);
  return Number.isInteger(buyerId) && buyerId > 0 ? buyerId : null;
}

export async function currentBuyer(): Promise<Buyer | null> {
  const buyerId = readCookie((await cookies()).get(COOKIE)?.value);
  if (!buyerId) return null;
  const rows = (await sql`
    select * from buyers where id = ${buyerId} and status = 'active'
  `) as Buyer[];
  return rows[0] ?? null;
}

export async function requireBuyer(): Promise<Buyer> {
  const buyer = await currentBuyer();
  if (!buyer) throw new Error("Not signed in");
  return buyer;
}
