import Link from "next/link";
import type { Metadata } from "next";
import { currentBuyer } from "@/lib/buyer-account";
import { currentBuyerKey } from "@/lib/buyer-auth";
import { shortWhen } from "@/lib/format";
import { listBuyerThreads } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Your messages" };

export default async function InboxPage() {
  const [key, buyer] = await Promise.all([currentBuyerKey(), currentBuyer()]);
  const threads = await listBuyerThreads(key, buyer ? { id: buyer.id, email: buyer.email } : null);

  return (
    <div className="wrap max-w-2xl py-10">
      <h1 className="font-display text-4xl font-extrabold tracking-[-0.04em]">Your messages</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Direct messages with sellers. If you win a piece, the shop can message you here once you are signed in.
      </p>

      {threads.length === 0 ? (
        <div className="panel mt-8 px-6 py-16 text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">No conversations yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
            Open a shop and hit Message seller. The thread lands here.
          </p>
          <Link href="/sellers" className="btn btn-lime mt-6">
            Browse shops
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {threads.map((thread) => (
            <li key={thread.id}>
              <Link
                href={`/inbox/${thread.id}`}
                className="panel block p-5 transition hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-lg font-extrabold tracking-tight">
                    {thread.shop_name}
                    {thread.last_sender === "seller" && (
                      <span className="ml-2 rounded-full bg-reef px-2 py-0.5 align-middle text-[11px] font-bold text-white uppercase">
                        New
                      </span>
                    )}
                  </p>
                  <p className="shrink-0 text-xs text-ink-faint">{shortWhen(thread.updated_at)}</p>
                </div>
                {thread.last_body && (
                  <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{thread.last_body}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
