/** Cents -> "$12.00". Safe to import from Client Components. */
export function money(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export function shortWhen(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Listed in the last two days — gets the "new" tag. */
export function isFresh(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 1000 * 60 * 60 * 48;
}
