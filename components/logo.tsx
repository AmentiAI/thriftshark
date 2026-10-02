import Image from "next/image";

/** Shark fin cutting a waterline — used where the full crest would be too small. */
export function SharkMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <path
        d="M4 23c6.5 0 9.5-4.5 11.5-9.5C17 9.6 19.4 5.4 23.5 3c-.6 6.2.6 13.6 4.5 20H4z"
        fill="currentColor"
      />
      <path
        d="M2 27c2.3 0 2.3-1.6 4.6-1.6S8.9 27 11.2 27s2.3-1.6 4.6-1.6S18.1 27 20.4 27s2.3-1.6 4.6-1.6S27.3 27 29.6 27"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function Wordmark({ className = "h-12 w-auto sm:h-14" }: { className?: string }) {
  return (
    <Image
      src="/nav-logo.jpg"
      alt="Thrift Sharks"
      width={1024}
      height={341}
      priority
      className={className}
    />
  );
}
