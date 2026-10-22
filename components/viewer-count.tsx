/** Eye and number, e.g. on the live header. */
export function ViewerCount({ count, dark = true }: { count: number; dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
        dark ? "bg-black/50 text-white" : "bg-paper-dim text-ink"
      }`}
      aria-label={`${count} watching`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {count}
    </span>
  );
}
