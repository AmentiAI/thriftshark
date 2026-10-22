import Link from "next/link";
import { WinnerList } from "@/components/winner-list";
import { toggleMessageHandled } from "@/lib/actions";
import { shortDate, shortWhen } from "@/lib/format";
import { sellerMessages, listSellerThreads, sellerAuctionWins, sellerNotices } from "@/lib/queries";
import { requireSeller } from "@/lib/seller-auth";

export const dynamic = "force-dynamic";

export default async function DashboardMessagesPage() {
  const seller = await requireSeller();
  const [threads, older, notices, wins] = await Promise.all([
    listSellerThreads(seller.id),
    sellerMessages(seller.id),
    sellerNotices(seller.id),
    sellerAuctionWins(seller.id),
  ]);
  const waiting = threads.filter((thread) => thread.last_sender === "buyer").length;

  return (
    <div>
      <header className="mb-7">
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em]">Messages</h2>
        <p className="mt-2 text-sm text-ink-soft">
          {waiting} waiting on you · {threads.length} conversation{threads.length === 1 ? "" : "s"}.
          Buyers reach you from Message seller. Winners of your pieces are listed here so you can message them.
        </p>
      </header>

      {notices.length > 0 && (
        <ul className="mb-8 space-y-3">
          {notices.map((notice) => (
            <li key={notice.id} className="panel p-5 ring-2 ring-gold/40">
              <p className="text-[11px] font-bold tracking-wider text-ink-faint uppercase">
                Thrift Sharks · {shortWhen(notice.created_at)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink">{notice.body}</p>
              {notice.kind === "verified_expiring" && (
                <Link href="/dashboard/verified" className="btn btn-ink mt-4">
                  Pay to keep Verified
                </Link>
              )}
              {notice.kind === "offer" && (
                <Link href="/dashboard/offers" className="btn btn-ink mt-4">
                  Confirm or deny
                </Link>
              )}
              {notice.kind === "hunt" && (
                <Link href="/hunts" className="btn btn-ink mt-4">
                  See the hunt
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      {wins.length > 0 && (
        <div className="mb-10">
          <WinnerList wins={wins} />
        </div>
      )}

      {threads.length === 0 ? (
        <div className="panel px-6 py-20 text-center">
          <h3 className="font-display text-2xl font-extrabold tracking-tight">No messages yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
            When a buyer messages your shop, the conversation shows up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {threads.map((thread) => (
            <li key={thread.id}>
              <Link
                href={`/dashboard/messages/${thread.id}`}
                className={`panel block break-anywhere p-5 transition hover:-translate-y-0.5 ${
                  thread.last_sender === "buyer" ? "ring-2 ring-reef/30" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-lg font-extrabold tracking-tight">
                    {thread.buyer_name}
                    {thread.last_sender === "buyer" && (
                      <span className="ml-2 rounded-full bg-coral px-2 py-0.5 align-middle text-[11px] font-bold text-white uppercase">
                        New
                      </span>
                    )}
                  </p>
                  <p className="shrink-0 text-xs text-ink-faint">{shortWhen(thread.updated_at)}</p>
                </div>
                <p className="mt-1 text-xs text-ink-faint">{thread.buyer_email}</p>
                {thread.last_body && (
                  <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{thread.last_body}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {older.length > 0 && (
        <section className="mt-14">
          <h3 className="font-display text-xl font-extrabold tracking-tight">Older questions</h3>
          <p className="mt-1 text-sm text-ink-soft">
            These arrived through the contact form, before direct messages.
          </p>
          <ul className="mt-4 space-y-3">
            {older.map((m) => (
              <li key={m.id} className={`panel break-anywhere p-5 ${m.handled ? "opacity-70" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-bold">{m.subject || "No subject"}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {m.name} ·{" "}
                      <a href={`mailto:${m.email}`} className="underline hover:text-reef-dark">
                        {m.email}
                      </a>
                    </p>
                  </div>
                  <p className="text-xs text-ink-faint">{shortDate(m.created_at)}</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink-soft">{m.body}</p>
                <form action={toggleMessageHandled} className="mt-4">
                  <input type="hidden" name="id" value={m.id} />
                  <button className="text-sm underline hover:text-reef-dark">
                    {m.handled ? "Mark unanswered" : "Mark answered"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
