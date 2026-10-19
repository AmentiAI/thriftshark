import "server-only";
import { headers } from "next/headers";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Server-only Stripe client. Never import this from a Client Component. */
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!client) {
    client = new Stripe(key);
  }
  return client;
}

export function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

/**
 * Prefer the host the browser actually hit (port matters in local next dev).
 * Falls back to NEXT_PUBLIC_SITE_URL when headers are unavailable.
 */
export async function requestOrigin() {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  } catch {
    // headers() can throw outside a request context
  }
  return siteUrl();
}

/**
 * Stripe rejects localhost / private hosts for business_profile.url.
 * Account Link return/refresh URLs may still use localhost in test mode.
 */
export function publicBusinessUrl(path = "") {
  const base = siteUrl();
  let host: string;
  try {
    host = new URL(base).hostname;
  } catch {
    return undefined;
  }
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host)
  ) {
    return undefined;
  }
  if (!base.startsWith("https://") && process.env.NODE_ENV === "production") {
    return undefined;
  }
  const suffix = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${base}${suffix}`;
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
