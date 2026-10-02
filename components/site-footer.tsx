import Link from "next/link";
import Image from "next/image";
import { NewsletterForm } from "@/components/newsletter-form";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-reef/20 blur-3xl" />
        <div className="wrap relative grid gap-12 py-16 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div className="space-y-5">
            <Image
              src="/logo.jpg"
              alt="Thrift Sharks"
              width={1024}
              height={682}
              className="h-36 w-auto rounded-2xl bg-white"
            />
            <p className="max-w-sm text-sm leading-relaxed text-paper/70">
              A marketplace for one-of-one secondhand. Independent sellers run
              their own storefronts, describe their own pieces, and get paid
              straight to Cash App — we take nothing.
            </p>
            <p className="text-xs font-semibold tracking-[0.16em] text-reef uppercase">
              Free to open a shop · No commission
            </p>
          </div>

          <div>
            <h2 className="eyebrow mb-4 text-reef">Shop</h2>
            <ul className="space-y-2.5 text-sm text-paper/75">
              {[
                ["/shop", "Everything"],
                ["/sellers", "All shops"],
                ["/auctions", "Auction house"],
                ["/shop?sort=newest", "New this week"],
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
                ["/sell", "Sell your merch"],
                ["/signup", "Open a shop"],
                ["/login", "Seller sign in"],
                ["/about", "How it works"],
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

        <div className="wrap relative border-t border-paper/10 py-10">
          <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-center">
            <div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight">
                First look at the drop.
              </h2>
              <p className="mt-2 text-sm text-paper/65">
                One email a week. The good stuff goes fast.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </div>

        <p
          aria-hidden
          className="wrap pointer-events-none pb-2 font-display text-[18vw] leading-none font-extrabold tracking-[-0.06em] text-paper/[0.06] md:text-[11rem]"
        >
          SHARK
        </p>

        <div className="wrap relative flex flex-col gap-2 border-t border-paper/10 py-6 text-xs text-paper/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Thrift Shark. Secondhand, first choice.</p>
          <p>Every piece inspected, washed and measured before it goes up.</p>
        </div>
      </div>
    </footer>
  );
}
