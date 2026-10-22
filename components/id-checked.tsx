/** Public mark that Stripe Identity passed. The document is never shown. */
export function IdChecked({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-paper-dim px-2 py-0.5 text-[10px] font-bold tracking-wide text-ink uppercase ring-1 ring-line ${className}`}
    >
      ID checked
    </span>
  );
}
