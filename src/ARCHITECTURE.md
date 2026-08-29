# Shot Sense — layered architecture

Dependency direction (each layer may import only from layers below it):

```
app/            Next.js routes, server/client components, route handlers
  ↓
features/       feature/service layer — orchestrates domain + repositories for a use case
  ↓
domain/         pure, framework-free scoring methodology. NO React / Next / Prisma / Supabase.
  ↑ (via mappers)
infrastructure/ Prisma repositories + mappers, Supabase client, Dexie offline + sync
lib/            small cross-cutting helpers with no domain knowledge
components/ui/  reusable presentational primitives (Button, Card, SegmentedControl, …)
styles/         globals.css + tokens.css
```

## Hard rules (enforced by ESLint `no-restricted-imports`)

- `domain/**` imports nothing from `react`, `next`, `@prisma/client`, `@supabase/*`,
  `dexie`, or any other layer. No `window`, `document`, Node built-ins, or
  `Date.now()` / `new Date()` inside calculations — pass time in as an argument.
- `app/**` and `components/**` never import `@prisma/client` or call repositories directly;
  they go through `features/**`.
- Prisma-generated types never cross into `domain/**` — convert at the mapper boundary.

## Auth enforcement boundary

Prisma connects through the Supabase pooler with a privileged role, so Postgres RLS does
**not** constrain it. **The repository layer is the enforcement boundary:** every repository
method takes the authenticated user id — resolved from the Supabase session in the feature
layer, never from client input — and scopes every query to it.

RLS is still enabled on every table (`auth.uid() = user_id`) as a backstop for any path that
reaches Postgres directly: supabase-js, Realtime, edge functions, the Supabase dashboard.

Upgrade path (only if V1's "one user per account" assumption ever breaks — e.g. coach
sharing): move to JWT-scoped Prisma connections so RLS enforces for the app too.

## Scoring engine

One engine, `domain/scoring`, runs identically on client (offline edits) and server
(authoritative post-sync recompute). A golden-file parity test in CI proves the two
environments produce byte-identical output.
