<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Thrift Shark

A multi-seller secondhand marketplace with an auction house, on Next.js 16 +
Postgres. See README.md for the layout and docs/payments.md for the money.

## Conventions

- Plain SQL, no ORM. Reads in `lib/queries.ts` and `lib/auctions.ts`, writes in
  `lib/actions.ts` (Server Actions). Pages never write to the database.
- **A column list is SQL text, not a value.** Interpolating one into a neon
  tagged template sends it as a bound parameter and the query silently returns
  a single bogus column. Any query built from a `*_COLUMNS` constant must go
  through `sql.query(text, params)`.
- Every seller action starts with `await requireSeller()` **and** re-checks
  `seller_id` in the statement. Every admin action starts with
  `await requireAdmin()`. Server Actions are reachable by direct POST, so a
  layout guard is not enough.
- Never pass a `Seller` row into a Client Component — it carries
  `password_hash`. Use `toShopSettings()`.
- Pages that read the database declare `export const dynamic = "force-dynamic"`,
  otherwise the result is baked in at build time.
- `lib/db.ts` is server-only. Client components import formatting from
  `lib/format.ts` so the Postgres driver never reaches the browser bundle.
- Colours and type come from the `@theme` block in `app/globals.css`; use the
  tokens (`ink`, `paper`, `reef`, `gold`, `coral`, `line`) and the component
  classes (`btn`, `field`, `panel`, `eyebrow-pill`), not raw hex.
- Animations go in `components/motion/` and animate transform/opacity only.
  Everything must have a `prefers-reduced-motion` off switch in `globals.css`.
- Stock is one-of-one. Treat any change to availability, checkout or bidding as
  concurrency-sensitive: see `lib/orders.ts` and `lib/auctions.ts`.
- Auctions have no scheduler. `settleDueAuctions()` runs from the read path.

## Checks

`npm run lint && npm run typecheck && npm run build` before calling work done.
