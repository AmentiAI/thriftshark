import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DmComposer } from "@/components/dm-composer";
import { DmTranscript } from "@/components/dm-transcript";
import { replyAsBuyer } from "@/lib/actions";
import { currentBuyerKey } from "@/lib/buyer-auth";
import { getBuyerThread, listDmMessages } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Message" };

export default async function InboxThreadPage(props: { params: Promise<{ id: string }> }) {
  const { id: raw } = await props.params;
  const id = Number(raw);
  const key = await currentBuyerKey();
  if (!key || !Number.isInteger(id)) notFound();

  const thread = await getBuyerThread(id, key);
  if (!thread) notFound();
  const messages = await listDmMessages(thread.id);

  return (
    <div className="wrap max-w-2xl py-10">
      <Link href="/inbox" className="text-sm font-semibold underline hover:text-reef-dark">
        All messages
      </Link>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
        {thread.shop_name}
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        <Link href={`/shop/${thread.handle}`} className="font-semibold underline hover:text-reef-dark">
          Visit the shop
        </Link>
        {thread.item_title && thread.item_slug && (
          <>
            {" · "}
            <Link href={`/item/${thread.item_slug}`} className="underline hover:text-reef-dark">
              {thread.item_title}
            </Link>
          </>
        )}
      </p>

      <div className="mt-8">
        <DmTranscript
          messages={messages}
          viewer="buyer"
          shopName={thread.shop_name}
          buyerName="You"
        />
        <DmComposer action={replyAsBuyer} threadId={thread.id} placeholder={`Reply to ${thread.shop_name}`} />
      </div>
    </div>
  );
}
