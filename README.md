# Shot Sense

PWA-first golf performance app. Helps amateur golfers see where their score is
leaking and what to work on next — built around a fixed 100-yard Scoring Zone and
the "enter in regulation / get down in 3" benchmark.

Full build plan: `../.claude/plans/this-is-my-plan-curious-church.md` (16 epics,
benchmark-first).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · vanilla CSS + CSS
Modules · Supabase Auth + Postgres · Prisma · Zod · Jest + React Testing Library ·
Playwright · ESLint · GitHub Actions · Vercel. Dexie/offline lands in Epic 7.

## Architecture

Layered, one direction of dependency — see [`src/ARCHITECTURE.md`](src/ARCHITECTURE.md).
The `src/domain/scoring` engine is framework-free and runs identically on client
and server. Auth is enforced at the repository layer (RLS is a backstop); ESLint
enforces the import boundaries.

## Local setup

1. `npm install`
2. Create a Supabase project. Copy `.env.example` to **`.env`** (not `.env.local` —
   the Prisma CLI only reads `.env`) and fill in the Project URL, anon key, and
   the pooled + direct Postgres connection strings. In the test project, turn
   **off** email confirmation (Authentication → Providers → Email) so signup
   lands straight on onboarding.
3. `npm run db:deploy` — applies `prisma/migrations/` (table + RLS policies).
4. `npm run dev`

`.env` is git-ignored. Never put a real secret in `.env.example`.

## Scripts

```bash
npm run dev         # dev server
npm run lint        # eslint
npm run typecheck   # next typegen + tsc --noEmit
npm test            # jest (unit + RTL)
npm run test:e2e    # playwright (auth journey skips without Supabase env)
npm run build       # production build
npm run db:deploy   # apply migrations (CI/prod-safe)
npm run db:migrate  # author a new migration (dev)
npm run db:studio   # Prisma Studio
```

CI runs lint / typecheck / test / build / e2e on every PR.
