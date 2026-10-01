import Link from "next/link";
import { SharkMark } from "@/components/logo";
import { NewsletterForm } from "@/components/newsletter-form";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="hatch">
        <div className="wrap grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <SharkMark className="h-8 w-8 text-reef" />
              <span className="font-display text-2xl font-bold">
                Thrift<span className="text-reef">Shark</span>
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-paper/70">
              A small secondhand shop with a big appetite. Everything is
              one-of-one, measured by hand, photographed as it actually is, and
              shipped within two days.
            </p>
            <p className="eyebrow text-paper/50">
              218 Harbour Road · Open Wed–Sun, 11–7
            </p>
          </div>

          <div>
            <h2 className="eyebrow mb-4 text-reef">Shop</h2>
            <ul className="space-y-2.5 text-sm text-paper/75">
              {[
                ["/shop", "Everything"],
                ["/shop?sort=newest", "New this week"],
                ["/shop?category=jackets", "Jackets"],
                ["/shop?category=denim", "Denim"],
                ["/shop?includeSold=1", "The sold archive"],
              ].map(([href, label]) => (
                <li key={label}>
                  <Link href={href} className="transition hover:text-reef">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="eyebrow mb-4 text-reef">Shop talk</h2>
            <ul className="space-y-2.5 text-sm text-paper/75">
              {[
                ["/about", "Our story"],
                ["/sell", "Sell or trade in"],
                ["/contact", "Contact & returns"],
                ["/admin", "Staff login"],
              ].map(([href, label]) => (
                <li key={label}>
                  <Link href={href} className="transition hover:text-reef">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="wrap border-t border-paper/15 py-10">
          <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-center">
            <div>
              <h2 className="font-display text-xl font-bold">
                Get first look at the drop
              </h2>
              <p className="mt-1 text-sm text-paper/65">
                One email a week. The good stuff goes fast.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </div>

        <div className="wrap flex flex-col gap-2 border-t border-paper/15 py-6 text-xs text-paper/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Thrift Shark. Secondhand, first choice.</p>
          <p>Every piece inspected, washed and measured before it goes up.</p>
        </div>
      </div>
    </footer>
  );
}
