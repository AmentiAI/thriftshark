# Getting sellers paid

Two different rails. Thrift Shark ships with the first one; the second is a real
upgrade path, with real strings attached.

## What we do today: seller $cashtag codes (peer to peer)

A seller types their `$cashtag`, and we store it plus a scannable code — either
one we generate from `https://cash.app/$tag` (`lib/images.ts`), or a screenshot
they upload themselves. A buyer checks out, gets one order per shop, and scans
that shop's code to send the total straight to the seller.

- **Fees:** none. Cash App's peer-to-peer sends are free, and we take no cut.
- **Onboarding:** a `$cashtag`. No KYC, no bank linking, nothing to approve.
- **Confirmation:** manual. Nothing tells us the money arrived, so the seller
  marks the order paid in their dashboard.
- **Protection:** none worth the name. Peer-to-peer sends are not purchase
  payments — there is no chargeback, and Cash App's buyer protection does not
  cover them. If a seller never ships, the buyer's recourse is you.
- **Good for:** launching, tiny volume, sellers who already trade this way.

## The upgrade: Cash App Pay as a real payment method

Cash App Pay is the *merchant* product. The buyer taps or scans at checkout,
authenticates in Cash App, and the payment settles to a merchant account like a
card would. Verified in the Stripe docs (October 2026):

- **Availability:** US accounts, US customers, USD only, domestic only. Not
  available to accounts in US territories. B2C only.
- **Marketplaces:** supported through Stripe **Connect** — so one connected
  account per seller, and the money can route to them.
- **Limits:** minimum $0.50. No business-level maximum, but Cash App applies
  per-customer sending limits, and Stripe recommends staying under ~$2,000 an
  order to avoid declines. Comfortable for secondhand clothing.
- **Settlement:** T+2. Refunds within 90 days, asynchronous, up to 10 business
  days, and cannot be cancelled. Disputes within 120 days, one per payment.
- **Integration:** Checkout Sessions (recommended), Payment Links, embedded
  form, Payment Element. **Not** the Express Checkout Element.
- **UX:** desktop buyers scan a QR; mobile buyers deep-link into Cash App and
  come back. Ten minutes to authenticate.
- **Watch the MCC.** Used-merchandise retail (5931) is fine, but several codes a
  marketplace could plausibly be filed under are *prohibited* for Cash App Pay —
  including 7278 "Buying/Shopping Services", 5964 "Direct Marketing – Catalog
  Merchant" and 5969 "Direct Marketing – Other". Get the category right at
  account creation.
- **One Connect gotcha:** a saved Cash App Pay payment method belongs to the
  business that was authorised. Platforms cannot clone saved Cash App Pay
  methods across connected accounts.

### Charge type decides whose name the buyer sees

| Charge type                         | Name on the statement / in Cash App |
| ----------------------------------- | ----------------------------------- |
| Direct charge                       | the connected account (the seller)  |
| Destination charge                  | the platform (Thrift Shark)         |
| Separate charge and transfer        | the platform                        |
| Destination with `on_behalf_of`     | the connected account               |

For a marketplace where the shop is the one shipping, **direct charges with an
application fee** keep the seller as the business of record — the buyer sees the
shop's name, and the seller carries their own refunds and disputes.

### What it would cost, and what it would ask of sellers

- Stripe's processing fee per transaction, plus Connect platform fees.
- Every seller does Connect onboarding: legal name, address, SSN or EIN, bank
  account. That is a real drop-off cliff compared with typing a `$cashtag`.
- You inherit platform obligations: disputes, refunds, payouts, 1099-Ks.

## Recommendation

Keep the `$cashtag` flow as the default — it is why a seller can open a shop in
a minute. Add Cash App Pay through **Stripe Connect with direct charges** as an
opt-in "verified checkout" for sellers who want automatic confirmation and
dispute handling, and show buyers which shops have it.

Where it would slot in:

1. `sellers` gains `stripe_account_id` and a `payouts_enabled` flag.
2. A Connect onboarding link from `/dashboard/shop`.
3. `placeOrder` in `lib/actions.ts`: if the shop has a live connected account,
   create a Checkout Session with `payment_method_types` including
   `cash_app_pay`, `stripe_account` set to the seller, and an application fee —
   otherwise fall through to today's QR order exactly as it works now.
4. A webhook route for `checkout.session.completed` to set
   `payment_status = 'paid'` instead of the seller doing it by hand.

The order schema already carries `payment_status`, so nothing has to be
restructured to add it.

## Sources

- [Stripe — Cash App Pay payments](https://docs.stripe.com/payments/cash-app-pay)
- [Stripe — Build a marketplace (Connect)](https://docs.stripe.com/connect/marketplace)
- [Stripe — Understand how charges work in a Connect integration](https://docs.stripe.com/connect/charges)
- [Square — Take a Payment with Cash App Pay](https://developer.squareup.com/docs/web-payments/add-cash-app-pay)
- [Square — Announcing Cash App Pay for Developers](https://developer.squareup.com/blog/announcing-cash-app-pay-for-developers/)
