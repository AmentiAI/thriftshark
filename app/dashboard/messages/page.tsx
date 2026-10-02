import Link from "next/link";
import { toggleMessageHandled } from "@/lib/actions";
import { shortDate } from "@/lib/format";
import { requireSeller } from "@/lib/seller-auth";
import { sellerMessages } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardMessagesPage() {
  const seller = await requireSeller();
  const messages = await sellerMessages(seller.id);
  const open = messages.filter((m) => !m.handled).length;

  return (
    <div>
      <header className="mb-7">
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em]">
          Buyer questions
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          {open} waiting on a reply · {messages.length} total. These come from
          the &ldquo;ask about this piece&rdquo; link on your listings.
        </p>
      </header>

      {messages.length === 0 ? (
        <div className="panel px-6 py-20 text-center">
          <h3 className="font-display text-2xl font-extrabold tracking-tight">
            No questions yet
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
            Buyers asking about a measurement or a flaw will show up here. The
            faster you answer, the more you sell.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`panel p-6 ${m.handled ? "opacity-70" : "ring-2 ring-reef/30"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display font-bold">
                    {m.subject || "No subject"}
                    {!m.handled && (
                      <span className="ml-2 rounded-full bg-coral px-2 py-0.5 align-middle text-[11px] font-bold text-white uppercase">
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
                        <Link href={`/dashboard/items/${m.item_id}`} className="underline">
                          about your listing
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <p className="text-xs text-ink-faint">{shortDate(m.created_at)}</p>
              </div>

              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink-soft">
                {m.body}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${m.email}?subject=Re:%20${encodeURIComponent(m.subject || "your question")}`}
                  className="btn btn-ink !px-4 !py-2 text-xs"
                >
                  Reply by email
                </a>
                <form action={toggleMessageHandled}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="text-sm underline hover:text-reef-dark">
                    {m.handled ? "Mark unanswered" : "Mark answered"}
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
