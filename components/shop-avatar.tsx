import Image from "next/image";

/** A shop's logo, or its initials when it has not uploaded one yet. */
export function ShopAvatar({
  shopName,
  logoImageId,
  size = 48,
  className = "",
}: {
  shopName: string;
  logoImageId: number | null;
  size?: number;
  className?: string;
}) {
  const initials = shopName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  if (logoImageId) {
    return (
      <Image
        src={`/api/images/${logoImageId}`}
        alt={`${shopName} logo`}
        width={size}
        height={size}
        className={`aspect-square shrink-0 rounded-full border border-line bg-paper object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      // 38cqw keeps the initials proportional even when a responsive class
      // overrides the box, which inline font-size could not do.
      className={`flex shrink-0 items-center justify-center rounded-full bg-ink font-display font-bold text-paper [container-type:size] ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="text-[38cqw] leading-none">{initials || "?"}</span>
    </span>
  );
}
