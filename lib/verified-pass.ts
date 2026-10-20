import { sql } from "@/lib/db";
import { SELLER_PLAN_PRICE_USD, VERIFIED_PASS_DAYS } from "@/lib/seller-plan";

/**
 * Shops inside the last 24 hours of Verified get one dashboard message, with a
 * link to pay for another 30 days. No scheduler — this runs from page loads.
 */
export async function remindExpiringVerified() {
  await sql`
    with due as (
      update sellers
      set verified_reminded_for = verified_until
      where official = false
        and verified_until > now()
        and verified_until <= now() + interval '24 hours'
        and verified_reminded_for is distinct from verified_until
      returning id, verified_until
    )
    insert into seller_notices (seller_id, kind, body)
    select
      id,
      'verified_expiring',
      'Your Verified badge ends within 24 hours. Pay $'
        || ${String(SELLER_PLAN_PRICE_USD)}
        || ' on the Verified tab to keep it for another '
        || ${String(VERIFIED_PASS_DAYS)}
        || ' days.'
    from due
  `;
}
