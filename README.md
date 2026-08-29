# Shot Sense

PWA-first golf performance app. Helps amateur golfers see where their score is
leaking and what to work on next — built around a fixed 100-yard Scoring Zone and
the "enter in regulation / get down in 3" benchmark.

Full build plan: `../.claude/plans/this-is-my-plan-curious-church.md` (16 epics,
benchmark-first). This branch is **Epic 0 — Foundation**.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · vanilla CSS + CSS
Modules · Jest + React Testing Library · Playwright · ESLint · GitHub Actions ·
Vercel. Supabase Auth/Postgres, Prisma, Zod, Dexie land in later epics.

## Architecture

Layered, one direction of dependency — see [`src/ARCHITECTURE.md`](src/ARCHITECTURE.md).
The `src/domain/scoring` engine is framework-free and runs identically on client
and server; ESLint enforces the import boundary.

## Scripts

```bash
npm run dev         # local dev server
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # jest (unit + RTL)
npm run test:e2e    # playwright
npm run build       # production build
```

CI runs all of the above on every PR.
