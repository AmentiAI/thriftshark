import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import type { Seller } from "@/lib/types";

const COOKIE = "shark_seller";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error("SESSION_SECRET must be set to at least 16 characters");
  }
  return value;
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/* ---------- passwords ---------- */

/** scrypt with a per-password salt, stored as "scrypt$salt$hash". */
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64).toString("hex");
  return safeEqual(candidate, hash);
}

/* ---------- sessions ---------- */

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export async function startSellerSession(sellerId: number) {
  const payload = `${sellerId}.${Date.now() + MAX_AGE_SECONDS * 1000}`;
  const store = await cookies();
  store.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSellerSession() {
  (await cookies()).delete(COOKIE);
}

function readCookie(raw: string | undefined) {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [id, expires, signature] = parts;
  if (!safeEqual(signature, sign(`${id}.${expires}`))) return null;
  if (Number(expires) <= Date.now()) return null;
  const sellerId = Number(id);
  return Number.isInteger(sellerId) && sellerId > 0 ? sellerId : null;
}

/** The signed-in seller, or null. Suspended shops cannot sign in. */
export async function currentSeller(): Promise<Seller | null> {
  const sellerId = readCookie((await cookies()).get(COOKIE)?.value);
  if (!sellerId) return null;

  const rows = (await sql`
    select * from sellers where id = ${sellerId} and status = 'active'
  `) as Seller[];
  return rows[0] ?? null;
}

/** Call at the top of every seller page and every seller Server Action. */
export async function requireSeller(): Promise<Seller> {
  const seller = await currentSeller();
  if (!seller) throw new Error("Not signed in");
  return seller;
}
