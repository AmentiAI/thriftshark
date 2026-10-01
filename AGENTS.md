<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Thrift Shark

Secondhand storefront on Next.js 16 + Postgres. See README.md for layout.

## Conventions

- Plain SQL, no ORM. Reads live in `lib/queries.ts`, writes in `lib/actions.ts`
  (Server Actions). Nothing writes to the database from a page component.
- Every admin Server Action starts with `await requireAdmin()`. Server Actions
  are reachable by direct POST, so the check cannot live only in the layout.
- Pages that read the database declare `export const dynamic = "force-dynamic"`,
  otherwise the result is baked in at build time.
- `lib/db.ts` is server-only. Client components import formatting from
  `lib/format.ts` so the Postgres driver never reaches the browser bundle.
- Colours and type come from the `@theme` block in `app/globals.css` — use the
  tokens (`ink`, `paper`, `reef`, `coral`, `line`), not raw hex.
- Stock is one-of-one. Treat any change to availability or checkout as
  concurrency-sensitive; see `lib/orders.ts`.

## Checks

`npm run lint && npm run typecheck && npm run build` before calling work done.
