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
        className={`shrink-0 rounded-full border border-line bg-paper object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-ink font-display font-bold text-paper ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials || "?"}
    </span>
  );
}
