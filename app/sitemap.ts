import type { MetadataRoute } from "next";
import { sql } from "@/lib/db";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items = (await sql`
    select slug, updated_at from items where status in ('available', 'sold')
  `) as { slug: string; updated_at: string }[];

  const categories = (await sql`select slug from categories`) as { slug: string }[];

  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/sell`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
    ...categories.map((c) => ({
      url: `${siteUrl}/shop?category=${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...items.map((i) => ({
      url: `${siteUrl}/item/${i.slug}`,
      lastModified: new Date(i.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}

export const revalidate = 3600;
