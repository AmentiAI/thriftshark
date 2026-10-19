import Link from "next/link";
import Image from "next/image";
import { NewsletterForm } from "@/components/newsletter-form";

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-line bg-paper">
      <div className="wrap grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Image
            src="/crest.png"
            alt="Thrift Sharks"
            width={96}
            height={64}
            className="h-10 w-auto"
          />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
            One-of-one secondhand. Independent shops, Stripe payouts.
          </p>
        </div>

        <div>
          <h2 className="eyebrow mb-3 text-ink-faint">Shop</h2>
          <ul className="space-y-2 text-sm text-ink-soft">
            {[
              ["/shop", "All finds"],
              ["/shop?sort=newest", "New drops"],
              ["/auctions", "Auctions"],
              ["/sellers", "Shops"],
            ].map(([href, label]) => (
              <li key={label}>
                <Link href={href} className="hover:text-ink">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="eyebrow mb-3 text-ink-faint">Company</h2>
          <ul className="space-y-2 text-sm text-ink-soft">
            {[
              ["/sell", "How it works"],
              ["/signup", "Open a shop"],
              ["/about", "About"],
              ["/contact", "Contact"],
              ["/terms", "Terms of Service"],
              ["/privacy", "Privacy Policy"],
            ].map(([href, label]) => (
              <li key={label}>
                <Link href={href} className="hover:text-ink">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="wrap grid gap-6 py-8 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div>
            <h2 className="text-base font-semibold">Get the drops</h2>
            <p className="mt-1 text-sm text-ink-faint">One email a week.</p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-line">
        <div className="wrap flex flex-col gap-2 py-5 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Thrift Sharks</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <span className="font-medium tracking-[0.1em] text-ink-soft uppercase">
              Secondhand. Not second best.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
