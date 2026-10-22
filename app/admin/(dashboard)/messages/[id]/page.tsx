import Link from "next/link";
import { notFound } from "next/navigation";
import { DmTranscript } from "@/components/dm-transcript";
import { requireAdmin } from "@/lib/auth";
import { shortWhen } from "@/lib/format";
import { dmBuyerProfile, getAdminThread, listDmMessages } from "@/lib/queries";
import { DmBuyerCard } from "@/components/dm-buyer-card";

export const dynamic = "force-dynamic";

export default async function AdminThreadPage(props: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: raw } = await props.params;
  const id = Number(raw);
  if (!Number.isInteger(id)) notFound();

  const thread = await getAdminThread(id);
  if (!thread) notFound();
  const [messages, profile] = await Promise.all([listDmMessages(thread.id), dmBuyerProfile(thread.id, thread.seller_id)]);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/messages" className="text-sm underline hover:text-reef-dark">
        All messages
      </Link>
      <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">
        {thread.buyer_name} and {thread.shop_name}
      </h2>
      <p className="mt-2 text-sm break-anywhere text-ink-soft">
        <a href={`mailto:${thread.buyer_email}`} className="underline">{thread.buyer_email}</a>
        {" · "}
        <Link href={`/shop/${thread.handle}`} className="underline">
          {thread.shop_name}
        </Link>
        {" · started "}
        {shortWhen(thread.created_at)}
        {thread.item_title && thread.item_slug && (
          <>
            {" · "}
            <Link href={`/item/${thread.item_slug}`} className="underline">
              {thread.item_title}
            </Link>
          </>
        )}
      </p>
      <p className="mt-3 text-xs font-semibold text-ink-faint">
        Read only. This is the full thread, for a dispute or a report.
      </p>

      {profile && <DmBuyerCard profile={profile} email={thread.buyer_email} scope="this shop" />}

      <div className="mt-8">
        <DmTranscript
          messages={messages}
          viewer="admin"
          shopName={thread.shop_name}
          buyerName={thread.buyer_name}
        />
      </div>
    </div>
  );
}
