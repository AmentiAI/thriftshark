/** Green check for a Verified buyer. Distinct from the shop Verified badge. */
export function BuyerCheck({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full bg-kelp text-white ${className}`}
      title="Verified buyer"
      aria-label="Verified buyer"
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
        <path
          d="M3.5 8.2l2.8 2.8 6.2-6.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
