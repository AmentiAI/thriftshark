/** Small checkmark label for shops on the $20/mo Verified plan. */
export function VerifiedBadge({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const icon = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-reef text-white ${box} ${className}`}
      title="Verified shop"
      aria-label="Verified shop"
    >
      <svg
        viewBox="0 0 16 16"
        className={icon}
        fill="none"
        aria-hidden
      >
        <path
          d="M3.5 8.5 6.5 11.5 12.5 4.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
