import Link from "next/link";
import type { ReactNode } from "react";
import { BuyerCheck } from "@/components/buyer-check";
import { money, shortDate } from "@/lib/format";
import type { DmBuyerProfile } from "@/lib/queries";

function Badge({ tone, children }: { tone: "kelp" | "reef" | "coral" | "ink"; children: ReactNode }) {
  const tones = {
    kelp: "bg-kelp/10 text-kelp",
    reef: "bg-reef/10 text-reef-dark",
    coral: "bg-coral/10 text-coral",
    ink: "bg-paper-dim text-ink-soft",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Who the shop is talking to: account, Verified, sizes, and history with the shop. */
export function DmBuyerCard({
  profile,
  email,
  scope,
}: {
  profile: DmBuyerProfile;
  email: string;
  /** "you" on the shop's own thread, "this shop" for admin. */
  scope: "you" | "this shop";
}) {
  const { account } = profile;
  const facts: [string, string][] = [
    ["Member since", account ? shortDate(account.member_since) : "No account"],
    [
      `Bought from ${scope}`,
      profile.paid_orders > 0
        ? `${profile.paid_orders} order${profile.paid_orders === 1 ? "" : "s"} · ${money(profile.spent_cents)}`
        : "Nothing yet",
    ],
    ["Bought on Thrift Sharks", `${profile.site_paid_orders} order${profile.site_paid_orders === 1 ? "" : "s"}`],
    [
      `Bids on ${scope === "you" ? "your" : "its"} auctions`,
      profile.auction_wins > 0 ? `${profile.bids} · won ${profile.auction_wins}` : String(profile.bids),
    ],
    [
      `Offers to ${scope}`,
      profile.pending_offers > 0 ? `${profile.offers} · ${profile.pending_offers} waiting` : String(profile.offers),
    ],
  ];

  return (
    <section className="panel mt-5 p-4 sm:p-5" aria-label="About this buyer">
      <div className="flex flex-wrap items-center gap-2">
        {account ? (
          <Badge tone="reef">Has an account</Badge>
        ) : (
          <Badge tone="ink">Guest, no account</Badge>
        )}
        {account?.verified && (
          <Badge tone="kelp">
            <BuyerCheck className="h-4 w-4" />
            Verified buyer
          </Badge>
        )}
        {account?.has_card && <Badge tone="kelp">Card on file</Badge>}
        {account?.suspended && <Badge tone="coral">Suspended</Badge>}
        {profile.own_shop && (
          <Link href={`/shop/${profile.own_shop.handle}`} className="tap inline-flex items-center">
            <Badge tone="ink">Runs {profile.own_shop.shop_name}</Badge>
          </Link>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {facts.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-[11px] font-bold tracking-wider text-ink-faint uppercase">{label}</dt>
            <dd className="mt-0.5 text-sm font-semibold break-anywhere">{value}</dd>
          </div>
        ))}
        <div className="min-w-0">
          <dt className="text-[11px] font-bold tracking-wider text-ink-faint uppercase">Email</dt>
          <dd className="mt-0.5 text-sm font-semibold break-anywhere">
            <a href={`mailto:${email}`} className="underline hover:text-reef-dark">
              {email}
            </a>
          </dd>
        </div>
      </dl>

      {account && account.sizes.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-[11px] font-bold tracking-wider text-ink-faint uppercase">Their sizes</p>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {account.sizes.map((size) => (
              <span key={size.label}>
                <span className="text-ink-soft">{size.label}</span> <span className="font-semibold">{size.value}</span>
              </span>
            ))}
          </p>
        </div>
      )}

      {profile.recent_orders.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-[11px] font-bold tracking-wider text-ink-faint uppercase">
            Recent orders with {scope}
          </p>
          <ul className="mt-2 space-y-2">
            {profile.recent_orders.map((order) => (
              <li key={order.id} className="text-sm">
                <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-semibold">{order.order_number}</span>
                  <span className="text-ink-soft">
                    {shortDate(order.created_at)} · {money(order.total_cents)}
                  </span>
                </p>
                <p className="break-anywhere text-ink-soft">
                  {[
                    order.items,
                    order.payment_status === "paid" ? order.status : order.payment_status,
                    order.fulfilment === "pickup" ? "pickup" : order.place ? `ships to ${order.place}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
          {scope === "you" && (
            <Link href="/dashboard/orders" className="mt-2 inline-block text-sm font-semibold underline hover:text-reef-dark">
              Your orders
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
