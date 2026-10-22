import { sql } from "@/lib/db";

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "your",
  "size",
  "mens",
  "women",
  "womens",
  "piece",
  "looking",
  "want",
  "need",
  "find",
  "found",
  "black",
  "white",
  "blue",
  "grey",
  "gray",
  "green",
  "brown",
  "pink",
  "navy",
  "red",
]);

export function huntTokens(value: string) {
  return [
    ...new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= 4 && !STOP.has(word)),
    ),
  ].slice(0, 8);
}

export function huntsOverlap(itemWords: string[], huntWords: string[]) {
  const set = new Set(huntWords);
  const hit = itemWords.filter((word) => set.has(word));
  if (hit.length >= 2) return true;
  if (hit.length === 1 && (hit[0].length >= 5 || huntWords.length === 1)) return true;
  return false;
}

type OpenHunt = {
  id: number;
  seller_id: number | null;
  title: string;
  details: string;
};

async function replyOnce(hunt: OpenHunt, item: { id: number; seller_id: number; title: string }) {
  const rows = (await sql`
    insert into hunt_replies (hunt_id, seller_id, item_id, note)
    select ${hunt.id}, ${item.seller_id}, ${item.id}, ${"Listed something close to this hunt."}
    where not exists (
      select 1 from hunt_replies
      where hunt_id = ${hunt.id} and item_id = ${item.id}
    )
    returning id
  `) as { id: number }[];
  if (!rows[0]) return false;

  await sql`
    insert into seller_notices (seller_id, kind, body)
    values (
      ${item.seller_id},
      'hunt',
      ${`Your “${item.title}” matches the hunt “${hunt.title}”. The poster can see it on Hunts.`}
    )
  `;
  if (hunt.seller_id && hunt.seller_id !== item.seller_id) {
    await sql`
      insert into seller_notices (seller_id, kind, body)
      values (
        ${hunt.seller_id},
        'hunt',
        ${`A shop listed “${item.title}” for your hunt “${hunt.title}”.`}
      )
    `;
  }
  return true;
}

async function matchItemToOpenHunts(item: { id: number; seller_id: number; title: string }) {
  const words = huntTokens(item.title);
  if (words.length === 0) return;
  const hunts = (await sql`
    select id, seller_id, title, details
    from hunts
    where status = 'open'
      and (seller_id is null or seller_id <> ${item.seller_id})
    order by created_at desc
    limit 40
  `) as OpenHunt[];
  let sent = 0;
  for (const hunt of hunts) {
    if (sent >= 3) break;
    if (!huntsOverlap(words, huntTokens(`${hunt.title} ${hunt.details}`))) continue;
    if (await replyOnce(hunt, item)) sent += 1;
  }
}

/** Live pieces that have not been matched yet, including drops whose time has passed. */
export async function releaseDueDrops() {
  const rows = (await sql`
    select id, seller_id, title
    from items
    where hunt_matched = false
      and status = 'available'
      and seller_id is not null
      and (drops_at is null or drops_at <= now())
    limit 15
  `) as { id: number; seller_id: number; title: string }[];
  for (const item of rows) {
    await matchItemToOpenHunts(item);
    await sql`update items set hunt_matched = true where id = ${item.id}`;
  }
}

/** A new hunt checks recent live listings and replies when the words line up. */
export async function matchHuntToLiveItems(huntId: number) {
  const hunts = (await sql`
    select id, seller_id, title, details
    from hunts
    where id = ${huntId} and status = 'open'
  `) as OpenHunt[];
  const hunt = hunts[0];
  if (!hunt) return;
  const words = huntTokens(`${hunt.title} ${hunt.details}`);
  if (words.length === 0) return;
  const items = (await sql`
    select i.id, i.seller_id, i.title
    from items i
    join sellers s on s.id = i.seller_id and s.status = 'active'
    where i.status = 'available'
      and (i.drops_at is null or i.drops_at <= now())
    order by i.created_at desc
    limit 60
  `) as { id: number; seller_id: number; title: string }[];
  let sent = 0;
  for (const item of items) {
    if (sent >= 3) break;
    if (hunt.seller_id && item.seller_id === hunt.seller_id) continue;
    if (!huntsOverlap(huntTokens(item.title), words)) continue;
    if (await replyOnce(hunt, item)) sent += 1;
  }
}
