import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { toggleMessageHandled } from "@/lib/actions";
import { shortDate } from "@/lib/format";
import { adminListMessages } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  await requireAdmin();
  const messages = await adminListMessages();
  const open = messages.filter((m) => !m.handled).length;

  return (
    <div>
      <header className="mb-6">
        <h2 className="font-display text-2xl font-bold tracking-tight">Messages</h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          {open} waiting on a reply · {messages.length} total
        </p>
      </header>

      {messages.length === 0 ? (
        <p className="border border-line bg-paper-dim/40 px-5 py-16 text-center text-sm text-ink-soft">
          No messages yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`break-anywhere border p-4 sm:p-5 ${m.handled ? "border-line bg-paper-dim/30" : "border-ink"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {m.subject || "No subject"}
                    {!m.handled && (
                      <span className="eyebrow ml-2 bg-coral px-1.5 py-0.5 align-middle text-white">
                        New
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {m.name} ·{" "}
                    <a href={`mailto:${m.email}`} className="underline hover:text-reef-dark">
                      {m.email}
                    </a>
                    {m.item_id && (
                      <>
                        {" · "}
                        <Link href={`/admin/items/${m.item_id}`} className="underline">
                          about item #{m.item_id}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <p className="text-xs text-ink-faint">{shortDate(m.created_at)}</p>
              </div>

              <p className="mt-3 leading-relaxed whitespace-pre-line text-sm text-ink-soft">
                {m.body}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${m.email}?subject=Re:%20${encodeURIComponent(m.subject || "your message")}`}
                  className="border border-ink px-4 py-2 text-sm font-semibold tracking-wide uppercase hover:bg-ink hover:text-paper"
                >
                  Reply
                </a>
                <form action={toggleMessageHandled}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="text-sm underline hover:text-reef-dark">
                    {m.handled ? "Mark unhandled" : "Mark handled"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
