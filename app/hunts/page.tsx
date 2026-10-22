import type { Metadata } from "next";
import Link from "next/link";
import { CloseHuntButton, HuntReplyForm, PostHuntForm } from "@/components/hunt-forms";
import { money, shortDate } from "@/lib/format";
import { openHunts, sellerItems } from "@/lib/queries";
import { currentBuyer } from "@/lib/buyer-account";
import { currentSeller } from "@/lib/seller-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hunts",
  description:
    "Post what you're looking for. Independent shops reply with a listing they actually have.",
};

export default async function HuntsPage() {
  const [hunts, buyer, seller] = await Promise.all([openHunts(), currentBuyer(), currentSeller()]);
  const listings = seller
    ? (await sellerItems(seller.id, "available")).map((item) => ({ id: item.id, title: item.title }))
    : [];
  const signedIn = Boolean(buyer || seller);

  return (
    <div className="wrap max-w-3xl py-10 sm:py-14">
      <header>
        <p className="eyebrow-pill">Hunts</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
          Tell shops what you&apos;re looking for
        </h1>
        <p className="mt-4 max-w-xl text-ink-soft">
          Can&apos;t find it? Post it. A shop that has it can reply with their
          listing. If you buy, you pay that shop through Stripe and they ship it to you.
        </p>
      </header>

      <div className="mt-8">
        <PostHuntForm signedIn={signedIn} />
      </div>

      {hunts.length === 0 ? (
        <p className="mt-10 border border-line px-5 py-10 text-center text-sm text-ink-soft">
          No open hunts yet.
        </p>
      ) : (
        <ul className="mt-10 space-y-4">
          {hunts.map((hunt) => {
            const mine =
              (buyer && hunt.buyer_id === buyer.id) || (seller && hunt.seller_id === seller.id);
            const canReply = Boolean(seller) && hunt.seller_id !== seller?.id;
            return (
              <li key={hunt.id} className="rounded-xl border border-line p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl font-bold tracking-tight">{hunt.title}</h2>
                  <p className="text-xs text-ink-faint">{shortDate(hunt.created_at)}</p>
                </div>
                <p className="mt-1 text-sm text-ink-soft">
                  {hunt.shop_handle ? (
                    <Link href={`/shop/${hunt.shop_handle}`} className="font-semibold text-ink underline">
                      {hunt.who}
                    </Link>
                  ) : (
                    <span className="font-semibold text-ink">{hunt.who}</span>
                  )}
                  {hunt.size_label ? ` · Size ${hunt.size_label}` : ""}
                  {hunt.budget_cents != null ? ` · up to ${money(hunt.budget_cents)}` : ""}
                </p>
                {hunt.details && (
                  <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink-soft">{hunt.details}</p>
                )}
                {hunt.replies.length > 0 && (
                  <ul className="mt-4 space-y-2 border-t border-line pt-3">
                    {hunt.replies.map((reply) => (
                      <li key={reply.id} className="text-sm">
                        <Link href={`/shop/${reply.handle}`} className="font-semibold underline">
                          {reply.shop_name}
                        </Link>
                        {reply.note ? <span className="text-ink-soft"> — {reply.note}</span> : null}
                        {reply.item_slug && (
                          <span className="mt-1 block">
                            <Link href={`/item/${reply.item_slug}`} className="font-semibold underline">
                              {reply.item_title}
                            </Link>
                            {reply.price_cents != null ? ` · ${money(reply.price_cents)}` : ""}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {mine && (
                  <div className="mt-3">
                    <CloseHuntButton huntId={hunt.id} />
                  </div>
                )}
                {canReply && <HuntReplyForm huntId={hunt.id} listings={listings} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
