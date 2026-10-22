import Link from "next/link";
import { ACTIVITY_LABELS, adminActivity, type ActivityKind } from "@/lib/admin-activity";
import { shortWhen } from "@/lib/format";

export const dynamic = "force-dynamic";

const KINDS = Object.keys(ACTIVITY_LABELS) as ActivityKind[];

export default async function AdminActivityPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await props.searchParams;
  const raw = typeof params.type === "string" ? params.type : "";
  const kind = KINDS.includes(raw as ActivityKind) ? (raw as ActivityKind) : null;
  const rows = await adminActivity(kind, 200);

  return (
    <div>
      <header className="mb-6">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Activity</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Every signup, listing, order, payment, offer, bid, auction, live show, hunt, message, and review, newest first.
        </p>
      </header>

      <nav className="scroll-x mb-6 flex gap-2" aria-label="Filter activity">
        <Link
          href="/admin/activity"
          className={`tap shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
            kind === null ? "border-ink bg-ink text-paper" : "border-line"
          }`}
        >
          All
        </Link>
        {KINDS.map((value) => (
          <Link
            key={value}
            href={`/admin/activity?type=${value}`}
            className={`tap shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap ${
              kind === value ? "border-ink bg-ink text-paper" : "border-line"
            }`}
          >
            {ACTIVITY_LABELS[value]}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="border border-line bg-paper-dim/40 px-5 py-10 text-center text-sm text-ink-soft">
          Nothing here yet.
        </p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((row, i) => {
            const body = (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-20 shrink-0 text-[11px] font-bold tracking-wider text-ink-faint uppercase">
                  {ACTIVITY_LABELS[row.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium break-anywhere">{row.title}</p>
                  {row.detail && <p className="mt-0.5 text-sm break-anywhere text-ink-soft">{row.detail}</p>}
                </div>
                <span className="shrink-0 text-xs text-ink-faint">{shortWhen(row.at)}</span>
              </div>
            );
            return (
              <li key={`${row.kind}-${row.at}-${i}`} className="py-3">
                {row.href ? (
                  <Link href={row.href} className="block hover:text-reef-dark">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
