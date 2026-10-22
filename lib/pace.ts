function hoursLabel(value: number | string | null | undefined) {
  if (value == null || value === "") return null;
  const hours = Number(value);
  if (!Number.isFinite(hours) || hours < 0) return null;
  if (hours < 1) return "under an hour";
  if (hours < 48) return `${Math.max(1, Math.round(hours))}h`;
  return `${Math.round(hours / 24)}d`;
}

/** Reply time and ship time, only when the shop has enough real orders or threads. */
export function paceBits(
  replyHours: number | string | null | undefined,
  shipHours: number | string | null | undefined,
) {
  const bits: string[] = [];
  const reply = hoursLabel(replyHours);
  const ship = hoursLabel(shipHours);
  if (reply) bits.push(`Replies in ${reply}`);
  if (ship) bits.push(`Ships in ${ship}`);
  return bits;
}
