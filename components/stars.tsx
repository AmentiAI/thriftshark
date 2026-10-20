/** Filled stars for a 1–5 rating. Safe in server and client components. */
export function Stars({
  rating,
  className = "",
}: {
  rating: number;
  className?: string;
}) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span
      className={`tracking-tight text-gold ${className}`}
      aria-label={`${rating} out of 5 stars`}
    >
      {"★★★★★".slice(0, full)}
      <span className="text-ink-faint">{"★★★★★".slice(full)}</span>
    </span>
  );
}
