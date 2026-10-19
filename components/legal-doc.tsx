import Link from "next/link";

export function LegalDoc({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <article className="wrap max-w-3xl py-10 sm:py-14">
      <header className="border-b border-line pb-8">
        <p className="eyebrow-pill">{eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-ink-faint">Last updated {updated}</p>
        <p className="mt-4 text-sm text-ink-soft">
          Questions?{" "}
          <Link href="/contact" className="font-medium text-ink underline underline-offset-2">
            Contact us
          </Link>
          .
        </p>
      </header>
      <div className="legal-prose pt-8">{children}</div>
    </article>
  );
}
