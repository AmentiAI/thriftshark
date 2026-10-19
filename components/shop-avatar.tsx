import Image from "next/image";

/** A shop's logo, or its initials when it has not uploaded one yet. */
export function ShopAvatar({
  shopName,
  logoImageId,
  size = 48,
  className = "",
  focalX = 50,
  focalY = 50,
}: {
  shopName: string;
  logoImageId: number | null;
  size?: number;
  className?: string;
  /** Where the photo sits inside the circle, as object-position percentages. */
  focalX?: number;
  focalY?: number;
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
        style={{ width: size, height: size, objectPosition: `${focalX}% ${focalY}%` }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink font-display font-extrabold text-white ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.34)) }}
    >
      {initials || "?"}
    </span>
  );
}
