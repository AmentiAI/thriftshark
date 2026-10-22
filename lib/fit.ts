/** Inches on a buyer profile or a listing. Shoe size stays a label. */
export type FitSource = {
  chest_in?: number | string | null;
  waist_in?: number | string | null;
  inseam_in?: number | string | null;
  shoe_size?: string | null;
};

function inches(value: number | string | null | undefined) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function shoe(value: string | null | undefined) {
  if (!value) return null;
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function line(part: string, mine: number, theirs: number, close: number) {
  const diff = theirs - mine;
  if (Math.abs(diff) <= close) return `Close to your ${part}`;
  if (diff > 0 && diff <= close * 2) return `A bit big in the ${part}`;
  if (diff < 0 && diff >= close * -2) return `A bit small in the ${part}`;
  return diff > 0 ? `Likely big in the ${part}` : `Likely small in the ${part}`;
}

/** One sentence comparing a signed-in buyer to a listing. Null when neither side measured. */
export function fitAgainst(buyer: FitSource | null | undefined, item: FitSource | null | undefined) {
  if (!buyer || !item) return null;
  const pairs: [string, number | null, number | null][] = [
    ["chest", inches(buyer.chest_in), inches(item.chest_in)],
    ["waist", inches(buyer.waist_in), inches(item.waist_in)],
    ["inseam", inches(buyer.inseam_in), inches(item.inseam_in)],
  ];
  for (const [part, mine, theirs] of pairs) {
    if (mine == null || theirs == null) continue;
    return line(part, mine, theirs, 1);
  }
  const mine = shoe(buyer.shoe_size);
  const theirs = shoe(item.shoe_size);
  if (mine == null || theirs == null) return null;
  return line("shoe", mine, theirs, 0.5);
}

export function isCloseFit(label: string | null) {
  return Boolean(label && (label.startsWith("Close") || label.startsWith("A bit")));
}

export function isFutureDrop(dropsAt: string | null | undefined, now = Date.now()) {
  if (!dropsAt) return false;
  const time = new Date(dropsAt).getTime();
  return Number.isFinite(time) && time > now;
}
