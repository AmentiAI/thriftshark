import Link from "next/link";
import { notFound } from "next/navigation";
import { DmComposer } from "@/components/dm-composer";
import { DmTranscript } from "@/components/dm-transcript";
import { replyAsSeller } from "@/lib/actions";
import { getSellerThread, listDmMessages } from "@/lib/queries";
import { requireSeller } from "@/lib/seller-auth";

export const dynamic = "force-dynamic";

export default async function SellerThreadPage(props: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id: raw } = await props.params;
  const id = Number(raw);
  if (!Number.isInteger(id)) notFound();

  const thread = await getSellerThread(id, seller.id);
  if (!thread) notFound();
  const messages = await listDmMessages(thread.id);

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/messages" className="text-sm font-semibold underline hover:text-reef-dark">
        All messages
      </Link>
      <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.03em]">
        {thread.buyer_name}
      </h2>
      <p className="mt-2 text-sm break-anywhere text-ink-soft">
        <a href={`mailto:${thread.buyer_email}`} className="underline hover:text-reef-dark">
          {thread.buyer_email}
        </a>
        {thread.item_title && (
          <>
            {" · "}
            <Link
              href={thread.item_slug ? `/item/${thread.item_slug}` : `/dashboard/items/${thread.item_id}`}
              className="underline hover:text-reef-dark"
            >
              {thread.item_title}
            </Link>
          </>
        )}
      </p>

      <div className="mt-8">
        <DmTranscript
          messages={messages}
          viewer="seller"
          shopName="You"
          buyerName={thread.buyer_name}
        />
        <DmComposer action={replyAsSeller} threadId={thread.id} placeholder={`Reply to ${thread.buyer_name}`} />
      </div>
    </div>
  );
}
