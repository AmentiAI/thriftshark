# Getting sellers paid

Thrift Sharks uses **Stripe Connect** with **Express** accounts and **direct
charges**. Buyers pay by card at checkout; money lands in the seller’s Stripe
account (then their bank). A flat **$5 platform fee** per shop order is charged
to the buyer and collected as a Stripe `application_fee_amount` — sellers keep
item price + shipping.

## How it works in this app

1. Seller opens a shop, then connects Stripe from **Dashboard → Your storefront**.
2. Stripe hosts KYC (legal name, ID, bank). When `charges_enabled` is true, the
   shop can sell.
3. Checkout creates **one order per shop**. For each ready seller we create a
   Checkout Session on their connected account (`stripeAccount`).
4. The webhook (`/api/stripe/webhook`) marks `payment_status = 'paid'` on
   `checkout.session.completed`. The browser success URL alone is not trusted.

## Env vars

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

Local webhook forwarding (Connect events need both flags):

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook --forward-connect-to localhost:3001/api/stripe/webhook
```

## Dashboard checklist (platform)

1. Test mode on (or Live when ready).
2. Connect enabled; platform profile complete.
3. **Branding** (do this in both Live and Test if you use both):
   - [Settings → Branding](https://dashboard.stripe.com/settings/branding) —
     upload the crest (`public/crest.png`), brand color `#0066ff`, accent
     near-black `#0a0a0a`, business name **Thrift Sharks**.
   - [Connect → Settings → Branding](https://dashboard.stripe.com/settings/connect) —
     same icon, color, and support URL `https://thriftsharks.com/contact`.
   - Custom domain `checkout.thriftsharks.com` (wait for Stripe’s DNS email).
4. Cards enabled under Payment methods.
5. Copy API keys into host env / `.env`.
6. Webhook to `https://thriftsharks.com/api/stripe/webhook` (plus Connected
   accounts destination if offered).

The app also applies Thrift Sharks colors, crest, and “Shop · Thrift Sharks”
naming on Checkout Sessions and new connected accounts (`lib/brand.ts`,
`lib/stripe.ts`).

Go live only after a full test purchase: seller onboarding → checkout →
`4242 4242 4242 4242` → order shows paid.

## Code map

| Piece | Where |
| --- | --- |
| Seller Connect columns | `db/schema.sql`, `sellers.stripe_*` |
| Stripe client | `lib/stripe.ts` |
| Checkout + sync helpers | `lib/stripe-connect.ts` |
| Onboarding + pay actions | `lib/actions.ts` |
| Webhook | `app/api/stripe/webhook/route.ts` |
| Seller UI | `components/stripe-connect-panel.tsx` |

## Sources

- [Stripe — Build a marketplace (Connect)](https://docs.stripe.com/connect/marketplace)
- [Stripe — Direct charges](https://docs.stripe.com/connect/direct-charges)
- [Stripe — Express accounts](https://docs.stripe.com/connect/express-accounts)
