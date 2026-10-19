# Thrift Shark

A marketplace for one-of-one secondhand. Sellers open their own shop, put their
own logo on it, list their merch, and get paid through Stripe Connect.
Next.js 16 (App Router) on Postgres, no ORM — plain SQL in `lib/`.

## Running it

```bash
npm install
cp .env.example .env          # already filled in locally
npm run db:migrate            # creates/updates tables (safe to re-run)
npm run dev                   # http://localhost:3000
```

The live database is empty and open for real sellers. For a local demo, run
`npm run db:seed && npm run db:seed:shops` against a **separate** database —
the seed wipes items and orders. Demo shop logins are the `@example.com`
addresses in `scripts/seed-sellers.mjs`, password `sharkdemo123`; remove them
again with `npm run db:reset -- --demo-only --yes`.
Platform admin is at `/admin`, gated by `ADMIN_PASSWORD`.

| Script                | What it does                                       |
| --------------------- | -------------------------------------------------- |
| `npm run dev`         | Dev server                                         |
| `npm run build`       | Production build (also typechecks)                 |
| `npm start`           | Serve the production build                         |
| `npm run typecheck`   | `tsc --noEmit`                                     |
| `npm run lint`        | ESLint                                             |
| `npm run db:migrate`  | Apply `db/schema.sql`                              |
| `npm run db:seed`     | **Wipes** items/orders, loads demo stock           |
| `npm run db:seed:shops` | Replaces the four demo shops and assigns stock   |
| `npm run db:reset`    | Dry run; `-- --yes` wipes all shops and sales, `-- --demo-only --yes` only the demo shops |

## The shape of it

```
app/
  page.tsx                 home — animated hero, live drop ticker, shop rail,
                           auctions, products, categories, seller pitch
  shop/                    /shop is the marketplace listing,
    [handle]/              /shop/<handle> is one seller's storefront
  item/[slug]/             listing page, credits the shop, links its lot
  auctions/                auction house index + /auctions/[id] lot page
  cart/  checkout/         bag and checkout (splits per shop)
  order/[token]/           receipt + Stripe pay button per shop
  signup/  login/          seller accounts
  dashboard/               seller-only: overview, listings, auctions, orders,
                           questions, storefront settings
  admin/                   platform-only: shops, inventory, orders, messages
  api/bag/                 live prices for the stored bag
  api/images/[id]/         serves uploaded images out of Postgres
  api/stripe/webhook/      Stripe Connect + Checkout events
components/
  motion/                  reveal, count-up, marquee, tilt, spotlight, stagger
  ...                      cards, forms, nav, countdown, bid form
lib/
  db.ts queries.ts         Neon client; every read query
  actions.ts               Server Actions — every write goes through here
  orders.ts  auctions.ts   checkout splitting; bidding and settlement
  auth.ts  seller-auth.ts  platform password; seller scrypt + session cookie
  images.ts                uploads stored in Postgres
  stripe.ts stripe-connect.ts  Connect client + checkout helpers
  types.ts  format.ts      shared types; `money()` is client-safe
db/schema.sql              the whole schema, re-runnable
docs/payments.md           Stripe Connect setup and env vars
```

## How it works

**Sellers own their listings.** Signup is instant — shop name and link. Sellers
then connect Stripe for payouts. Every seller query and write is scoped by
`seller_id`, and each Server Action re-checks ownership in the statement itself,
because actions are reachable by direct POST.

**Buyers pay each shop through Stripe.** A bag can hold pieces from several
shops, so checkout writes **one order per shop**, tied together by a group
token. The receipt opens a Checkout Session on that seller’s connected account.
No money passes through the platform — see `docs/payments.md`.

**Stock is one-of-one.** `createOrder` inserts the orders, their lines and the
sold flags in a single statement using `for update` and a `having` guard, so two
buyers racing for the same jacket cannot both win — the loser is told which
piece went, and nothing partial is written.

**Auctions settle without a scheduler.** Any page that lists auctions calls
`settleDueAuctions()` first, so a lot closes on the next visit after its end
time. Settling is one statement: the winning bid becomes a real order the winner
pays through Stripe, the item is marked sold, and a lot that missed its reserve
puts the piece back on the rack at its fixed price. Bids are guarded the same
way — the insert only lands if it still clears the high bid plus the increment.

**Uploads are shrunk on the device.** `components/image-field.tsx` decodes a
picked photo into a canvas, downscales it and re-encodes it as JPEG before the
form is submitted. That is what makes phone uploads work: a camera photo is
several megabytes and an iPhone shoots HEIC, and this turns both into something
small that every browser and the server agree on. If a browser cannot decode
the file, the original is sent and the server validates it — HEIC/HEIF, AVIF,
JPEG, PNG, WebP and GIF are accepted, by MIME type or by extension when the
picker reports `application/octet-stream`.

**Listings take up to ten photos.** The listing form's photo set
(`PhotoSetField`) adds to the set on every pick, so a seller can choose one
photo at a time from a phone, then remove, reorder or pick a cover. It submits
the new files plus an order list; `savePhotoSet` in `lib/actions.ts` keeps
exactly that set and frees the bytes of any photo dropped or deleted.

**Images live in Postgres.** Logos, banners, listing photos and uploaded Cash
App codes are stored as rows and served by `/api/images/[id]` with immutable
cache headers. One dependency, no bucket to configure; swap `lib/images.ts` for
object storage if volume ever demands it.

**Motion.** `components/motion/` holds the animation primitives — scroll
reveals, count-ups, seamless marquees, pointer tilt and spotlight. They animate
transform and opacity only, and everything switches off under
`prefers-reduced-motion`.

## Before going live

- Change `ADMIN_PASSWORD` and `SESSION_SECRET` in `.env` (never commit `.env`).
- Set `NEXT_PUBLIC_SITE_URL` to the real domain — canonical URLs, `sitemap.xml`
  and `robots.txt` read it.
- **Wire real email.** Nothing is emailed yet: order confirmations, auction wins
  and buyer questions only land in the database and the dashboards. Auction
  winners currently reach their order by typing their bidding email on the lot
  page.
- Bidding is open to anyone with an email address. Add verification before you
  run auctions that matter.
- Replace the placeholder shop copy in `app/about`, `app/sell` and
  `components/site-footer.tsx`.
- Use a long `ADMIN_PASSWORD` (20+ characters) — `/admin` can pull any listing.
