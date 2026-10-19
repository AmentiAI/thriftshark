import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { DmStartForm } from "@/components/dm-start-form";
import { currentBuyerKey } from "@/lib/buyer-auth";
import { findBuyerThread, getItemById, getSellerByHandle } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await props.params;
  const seller = await getSellerByHandle(handle);
  return { title: seller ? `Message ${seller.shop_name}` : "Message shop" };
}

export default async function MessageShopPage(props: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { handle } = await props.params;
  const seller = await getSellerByHandle(handle);
  if (!seller) notFound();

  const key = await currentBuyerKey();
  if (key) {
    const existing = await findBuyerThread(seller.id, key);
    if (existing) redirect(`/inbox/${existing.id}`);
  }

  const params = await props.searchParams;
  const rawItem = Array.isArray(params.item) ? params.item[0] : params.item;
  const itemId = Number(rawItem);
  const item =
    Number.isInteger(itemId) && itemId > 0 ? await getItemById(itemId) : null;
  const about = item && item.seller_id === seller.id ? item : null;

  return (
    <div className="wrap max-w-2xl py-10">
      <p className="eyebrow-pill">Direct message</p>
      <h1 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.04em]">
        Message {seller.shop_name}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Private thread with this seller. They reply in their dashboard; you keep talking in Inbox.{" "}
        <Link href={`/shop/${seller.handle}`} className="font-semibold underline hover:text-reef-dark">
          Back to the shop
        </Link>
      </p>
      <div className="panel mt-8 p-5 sm:p-8">
        <DmStartForm handle={seller.handle} itemId={about?.id} itemTitle={about?.title} />
      </div>
    </div>
  );
}
