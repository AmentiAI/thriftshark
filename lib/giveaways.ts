import { sql } from "@/lib/db";
import { utcWeekStart } from "@/lib/queries";
import type { WeeklyGiveaway } from "@/lib/types";

const DEFAULT_TITLE = "Weekly giveaway";
const DEFAULT_PRIZE = "A surprise prize from Thrift Sharks";

function weekStartDate(d = new Date()): string {
  return utcWeekStart(d).toISOString().slice(0, 10);
}

/**
 * Current week's giveaway. Creates the row on first visit so the homepage
 * widget always has something to show (same idea as auction settlement).
 */
export async function ensureCurrentGiveaway(): Promise<WeeklyGiveaway> {
  const week = weekStartDate();
  const existing = (await sql`
    select g.*,
      (select count(*)::int from giveaway_entries e where e.giveaway_id = g.id) as entry_count,
      ws.handle as winner_handle,
      ws.shop_name as winner_shop_name
    from weekly_giveaways g
    left join sellers ws on ws.id = g.winner_seller_id
    where g.week_start = ${week}::date
  `) as WeeklyGiveaway[];

  if (existing[0]) return existing[0];

  // Copy prize copy from last week when present so admin does not retype it.
  const prev = (await sql`
    select title, prize_text from weekly_giveaways
    order by week_start desc limit 1
  `) as { title: string; prize_text: string }[];

  const title = prev[0]?.title ?? DEFAULT_TITLE;
  const prize = prev[0]?.prize_text ?? DEFAULT_PRIZE;

  const created = (await sql`
    insert into weekly_giveaways (week_start, title, prize_text)
    values (${week}::date, ${title}, ${prize})
    on conflict (week_start) do update set week_start = excluded.week_start
    returning *
  `) as WeeklyGiveaway[];

  return {
    ...created[0],
    entry_count: 0,
    winner_handle: null,
    winner_shop_name: null,
  };
}

export async function sellerEnteredGiveaway(
  giveawayId: number,
  sellerId: number,
): Promise<boolean> {
  const rows = (await sql`
    select 1 from giveaway_entries
    where giveaway_id = ${giveawayId} and seller_id = ${sellerId}
    limit 1
  `) as unknown[];
  return rows.length > 0;
}

export async function listGiveaways(limit = 12): Promise<WeeklyGiveaway[]> {
  return (await sql`
    select g.*,
      (select count(*)::int from giveaway_entries e where e.giveaway_id = g.id) as entry_count,
      ws.handle as winner_handle,
      ws.shop_name as winner_shop_name
    from weekly_giveaways g
    left join sellers ws on ws.id = g.winner_seller_id
    order by g.week_start desc
    limit ${limit}
  `) as WeeklyGiveaway[];
}

export async function getGiveawayById(id: number): Promise<WeeklyGiveaway | null> {
  const rows = (await sql`
    select g.*,
      (select count(*)::int from giveaway_entries e where e.giveaway_id = g.id) as entry_count,
      ws.handle as winner_handle,
      ws.shop_name as winner_shop_name
    from weekly_giveaways g
    left join sellers ws on ws.id = g.winner_seller_id
    where g.id = ${id}
  `) as WeeklyGiveaway[];
  return rows[0] ?? null;
}
