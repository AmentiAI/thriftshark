import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { headers } from "next/headers";
import Stripe from "stripe";
import { BRAND } from "@/lib/brand";

let client: Stripe | null = null;
let brandIconFileId: string | null | undefined;

/**
 * Preview API required for Express Dashboard + Stripe Managed Risk
 * (negative-balance responsibility on Stripe). See Connect platform profile.
 */
const STRIPE_API_VERSION = "2026-09-30.preview" as Stripe.LatestApiVersion;

/** Server-only Stripe client. Never import this from a Client Component. */
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!client) {
    client = new Stripe(key, { apiVersion: STRIPE_API_VERSION });
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

/** Upload crest once per process for Connect / Checkout branding. */
export async function thriftSharksIconFileId() {
  if (brandIconFileId !== undefined) return brandIconFileId;
  try {
    const stripe = getStripe();
    const filePath = path.join(process.cwd(), "public", "crest.png");
    const data = await readFile(filePath);
    const file = await stripe.files.create({
      purpose: "business_icon",
      file: {
        data,
        name: "thrift-sharks-crest.png",
        type: "image/png",
      },
    });
    brandIconFileId = file.id;
  } catch (err) {
    console.error("Could not upload Thrift Sharks brand icon to Stripe", err);
    brandIconFileId = null;
  }
  return brandIconFileId;
}

/** Apply Thrift Sharks colors + icon on a connected Express account. */
export async function applyThriftSharksAccountBranding(accountId: string) {
  const stripe = getStripe();
  const icon = await thriftSharksIconFileId();
  await stripe.accounts.update(accountId, {
    settings: {
      branding: {
        primary_color: BRAND.primary,
        secondary_color: BRAND.ink,
        ...(icon ? { icon } : {}),
      },
    },
    business_profile: {
      support_url: `${siteUrl()}${BRAND.supportUrlPath}`,
    },
  });
}

/** Checkout Session branding override (direct charges still show shop context). */
export function checkoutBrandingSettings(shopName: string | null | undefined) {
  return {
    display_name: shopName?.trim()
      ? `${shopName.trim()} · ${BRAND.name}`
      : BRAND.name,
    background_color: BRAND.paper,
    button_color: BRAND.primary,
    border_style: "rounded" as const,
    font_family: "inter" as const,
  };
}
