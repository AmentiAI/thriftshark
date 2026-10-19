import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { toggleMessageHandled } from "@/lib/actions";
import { shortDate, shortWhen } from "@/lib/format";
import { adminListMessages, listAdminThreads } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await props.searchParams;
  const rawQ = Array.isArray(params.q) ? params.q[0] : params.q;
  const q = (rawQ ?? "").trim();

  const [threads, contact] = await Promise.all([
    listAdminThreads(q || undefined),
    adminListMessages(),
  ]);
  const waiting = threads.filter((thread) => thread.last_sender === "buyer").length;

  return (
    <div>
      <header className="mb-6">
        <h2 className="font-display text-2xl font-bold tracking-tight">Messages</h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          Pull any buyer ↔ shop conversation. {threads.length} shown
          {q ? ` for “${q}”` : ""} · {waiting} waiting on a shop.
        </p>
      </header>

      <form method="get" className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, email, shop, handle, item, or thread #"
          className="field w-full sm:flex-1"
        />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <button className="btn btn-ink !px-4 !py-3 text-xs sm:!py-2.5">Pull</button>
          {q ? (
            <Link href="/admin/messages" className="btn btn-ghost !px-4 !py-3 text-xs sm:!py-2.5">
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      {threads.length === 0 ? (
        <p className="border border-line bg-paper-dim/40 px-5 py-16 text-center text-sm text-ink-soft">
          {q ? "Nothing matched that search." : "No direct messages yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {threads.map((thread) => (
            <li key={thread.id}>
              <Link
                href={`/admin/messages/${thread.id}`}
                className={`block break-anywhere border p-4 transition hover:border-ink sm:p-5 ${
                  thread.last_sender === "buyer" ? "border-ink" : "border-line"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="font-medium">
                    #{thread.id} · {thread.buyer_name}
                    <span className="text-ink-faint"> → {thread.shop_name}</span>
                    {thread.last_sender === "buyer" && (
                      <span className="eyebrow ml-2 bg-coral px-1.5 py-0.5 align-middle text-white">
                        Waiting
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-faint">{shortWhen(thread.updated_at)}</p>
                </div>
                <p className="mt-1 text-xs break-anywhere text-ink-faint">{thread.buyer_email}</p>
                {thread.item_title && (
                  <p className="mt-1 text-xs text-ink-faint">About {thread.item_title}</p>
                )}
                {thread.last_body && (
                  <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{thread.last_body}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {contact.length > 0 && (
        <section className="mt-14">
          <h3 className="font-display text-xl font-bold">Contact form</h3>
          <p className="mt-1 text-sm text-ink-soft">
            Messages sent to the site, not to a shop.
          </p>
          <ul className="mt-4 space-y-3">
            {contact.map((m) => (
              <li
                key={m.id}
                className={`break-anywhere border p-4 sm:p-5 ${
                  m.handled ? "border-line bg-paper-dim/30" : "border-ink"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{m.subject || "No subject"}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {m.name} ·{" "}
                      <a href={`mailto:${m.email}`} className="underline">
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
                    {m.handled ? "Mark unhandled" : "Mark handled"}
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
