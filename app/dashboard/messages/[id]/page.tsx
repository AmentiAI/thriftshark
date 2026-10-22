import Link from "next/link";
import { notFound } from "next/navigation";
import { DmBuyerCard } from "@/components/dm-buyer-card";
import { DmComposer } from "@/components/dm-composer";
import { DmTranscript } from "@/components/dm-transcript";
import { replyAsSeller } from "@/lib/actions";
import { dmBuyerProfile, getSellerThread, listDmMessages } from "@/lib/queries";
import { requireSeller } from "@/lib/seller-auth";

export const dynamic = "force-dynamic";

export default async function SellerThreadPage(props: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id: raw } = await props.params;
  const id = Number(raw);
  if (!Number.isInteger(id)) notFound();

  const thread = await getSellerThread(id, seller.id);
  if (!thread) notFound();
  const [messages, profile] = await Promise.all([
    listDmMessages(thread.id),
    dmBuyerProfile(thread.id, seller.id),
  ]);

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/messages" className="text-sm font-semibold underline hover:text-reef-dark">
        All messages
      </Link>
      <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.03em] break-anywhere">
        {thread.buyer_name}
      </h2>
      {thread.item_title && (
        <p className="mt-2 text-sm break-anywhere text-ink-soft">
          About{" "}
          <Link
            href={thread.item_slug ? `/item/${thread.item_slug}` : `/dashboard/items/${thread.item_id}`}
            className="underline hover:text-reef-dark"
          >
            {thread.item_title}
          </Link>
        </p>
      )}

      {profile && <DmBuyerCard profile={profile} email={thread.buyer_email} scope="you" />}

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
