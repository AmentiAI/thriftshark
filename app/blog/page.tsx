import type { Metadata } from "next";
import Link from "next/link";
import { posts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Guides for reselling, designer vintage, and secondhand",
  description:
    "How to sell designer vintage, bags, denim, jackets, streetwear, and sneakers, and how to buy one-of-one secondhand.",
  alternates: { canonical: "/blog" },
};

function published(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogIndexPage() {
  return (
    <div className="wrap max-w-3xl py-12 sm:py-16">
      <header>
        <p className="eyebrow-pill">Guides</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
          Reselling, designer vintage, and buying one-of-one
        </h1>
        <p className="mt-4 max-w-xl text-ink-soft">
          Practical notes for opening a shop and for buying from one. Designer
          vintage, denim, jackets, tees, streetwear, and sneakers. Sellers keep
          their own goods. Thrift Sharks takes a fee on the order.
        </p>
      </header>

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="block py-5 hover:text-ink">
              <p className="text-xs font-semibold text-ink-faint">{published(post.date)}</p>
              <h2 className="mt-1 font-display text-xl font-bold tracking-tight sm:text-2xl">
                {post.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{post.description}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/signup?as=store" className="btn btn-ink">
          Open a shop
        </Link>
        <Link href="/shop" className="btn btn-ghost">
          Browse finds
        </Link>
      </div>
    </div>
  );
}
