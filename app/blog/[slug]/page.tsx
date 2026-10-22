import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, posts, relatedPosts, type Inline } from "@/lib/blog";

function published(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function Inlines({ inlines }: { inlines: Inline[] }) {
  return inlines.map((part, index) =>
    typeof part === "string" ? (
      <span key={index}>{part}</span>
    ) : (
      <Link key={index} href={part.href}>
        {part.text}
      </Link>
    ),
  );
}

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) return { title: "Guide not found" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const related = relatedPosts(post.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "Thrift Sharks" },
    publisher: { "@type": "Organization", name: "Thrift Sharks" },
    mainEntityOfPage: `${siteUrl.replace(/\/$/, "")}/blog/${post.slug}`,
  };

  return (
    <article className="wrap max-w-3xl py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="border-b border-line pb-8">
        <p className="eyebrow-pill">
          <Link href="/blog">Guides</Link>
        </p>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-ink-faint">{published(post.date)}</p>
      </header>

      <div className="legal-prose pt-8">
        {post.blocks.map((block, index) => {
          if (block.kind === "h2") return <h2 key={index}>{block.text}</h2>;
          if (block.kind === "ul") {
            return (
              <ul key={index}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          }
          return (
            <p key={index}>
              <Inlines inlines={block.inlines} />
            </p>
          );
        })}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/signup?as=store" className="btn btn-ink">
          Open a shop
        </Link>
        <Link href="/shop" className="btn btn-ghost">
          Browse finds
        </Link>
      </div>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-lg font-bold tracking-tight">More guides</h2>
        <ul className="mt-4 space-y-3">
          {related.map((item) => (
            <li key={item.slug}>
              <Link href={`/blog/${item.slug}`} className="font-semibold underline underline-offset-2">
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
