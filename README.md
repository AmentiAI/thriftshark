# Thrift Shark

A storefront for a one-of-one secondhand shop, plus the staff panel that runs it.
Next.js 16 (App Router) on Postgres, no ORM — plain SQL in `lib/queries.ts`.

## Running it

```bash
npm install
cp .env.example .env     # already filled in locally
npm run db:migrate       # creates the tables (safe to re-run)
npm run db:seed          # 26 demo items — skip this on a real shop
npm run dev              # http://localhost:3000
```

The staff panel is at `/admin`, gated by `ADMIN_PASSWORD` from `.env`.

| Script              | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Dev server                                    |
| `npm run build`     | Production build (also typechecks)            |
| `npm start`         | Serve the production build                    |
| `npm run typecheck` | `tsc --noEmit`                                |
| `npm run lint`      | ESLint                                        |
| `npm run db:migrate`| Apply `db/schema.sql`                         |
| `npm run db:seed`   | **Wipes** items/orders and loads demo stock   |

## The shape of it

```
app/
  page.tsx                 home — hero, categories, staff picks, new in
  shop/                    listing with filters, search, sort, pagination
  item/[slug]/             item page, gallery, related pieces
  cart/  checkout/         bag and checkout
  order/[number]/          receipt, doubles as order lookup
  about/  sell/  contact/  shop pages; contact writes to `messages`
  admin/
    login/                 password form (outside the auth guard)
    (dashboard)/           everything behind the guard
      page.tsx             counters, latest orders, unanswered messages
      items/               inventory list, add, edit, delete, status
      orders/              fulfilment and payment status
      messages/            inbox
  api/bag/                 live prices/availability for the stored bag
lib/
  db.ts                    Neon client
  queries.ts               every read query
  orders.ts                order creation (see below)
  actions.ts               Server Actions — all writes go through here
  auth.ts                  signed staff session cookie
  types.ts  format.ts      shared types; `money()` is client-safe
db/schema.sql              the whole schema
scripts/                   migrate.mjs, seed.mjs
```

## Two decisions worth knowing

**Stock is single-piece.** Every item is quantity one, so "add to bag" reserves
nothing — only checkout does. `createOrder` inserts the order, its lines, and
marks the items sold in **one statement** with `for update`, so two people
checking out the same jacket cannot both win: the loser's items drop out of the
CTE, the `having count(*)` guard fails, nothing is written, and they get told
which piece went. The bag itself lives in `localStorage` (no accounts) and is
re-priced against the database on every view.

**Checkout records an order; it does not take payment.** Orders land as
`payment_status = 'pending'` and you send a payment link from the admin panel.
To add Stripe later, call it from `placeOrder` in `lib/actions.ts` after
`createOrder` succeeds — the schema already has the status fields for it.

## Item photos

Photos are URLs, not uploads: paste one per line in the admin item form, first
is the cover. The host has to be allowed in `next.config.ts` → `images.remotePatterns`.
Seed data uses `picsum.photos` placeholders, so replace those with real
photography before launch.

## Before going live

- Change `ADMIN_PASSWORD` and `SESSION_SECRET` in `.env` (never commit `.env`).
- Set `NEXT_PUBLIC_SITE_URL` to the real domain — canonical URLs, `sitemap.xml`
  and `robots.txt` read it.
- Replace the placeholder address, hours and policy copy in
  `components/site-footer.tsx`, `app/about`, `app/sell` and `app/contact`.
- Wire real email: the contact form and orders only write to the database today,
  so nothing is emailed to you or the customer yet.
