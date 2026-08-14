# Technical Architecture Plan

Companion to [spec.md](./spec.md) (what to build) and [data-model.md](./data-model.md) (the schema). This
document is the "how" — stack choices and the reasoning behind them, so implementation in
[tasks.md](./tasks.md) doesn't have to re-derive it.

Versions below were verified against current releases as of **August 2026**; re-check `npm view <pkg>
versions` at scaffold time since this stack moves fast.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), TypeScript | Single deployable, no separate backend (constraint #0) |
| Auth | Auth.js v5 (`next-auth@5`), Credentials provider, JWT session strategy | No DB call needed to gate routes; no Student accounts to manage |
| Database | Neon (serverless Postgres), pooled connection | Vercel Postgres is discontinued (see §3) |
| ORM | Prisma 7, `@prisma/adapter-neon` driver adapter | Prisma 7 requires a driver adapter; Neon's is the serverless-native choice |
| Styling/UI | Tailwind CSS + shadcn/ui | Fast to build accessible tables/forms; no separate design system needed |
| Data fetching (public) | SWR, polling `refreshInterval` | Constraint #0: no websockets, Vercel functions can't hold a socket open |
| Data fetching (admin/coordinator mutations) | Server Actions | Colocated with forms, automatic CSRF protection, revalidation via `mutate()`/`revalidatePath()` |
| Password hashing | `bcryptjs` | Pure JS — avoids native-binding build failures in Vercel's bundler that plague native `bcrypt` |

## 1. Deployment Architecture: Why No Separate Backend

The entire app — public leaderboard, Coordinator point-logging, Admin configuration — is one Next.js
project deployed to Vercel. There is no separate API server:

- **Reads** (public leaderboard, breakdowns) are Next.js **Route Handlers** (`app/api/**/route.ts`) —
  needed because SWR requires a GET-able URL to poll; Server Actions are POST-only and not pollable.
- **Writes** (Admin CRUD, Coordinator point-logging) are **Server Actions**, colocated with the forms that
  call them.
- **Auth gating** happens in `proxy.ts` (see §2) — a Next.js file, not a separate service.

This keeps the whole system inside "Next.js only," satisfying constraint #0, and means Vercel's normal
build/deploy pipeline is the entire deployment story — no infra to provision beyond the database.

## 2. Auth Architecture

**Framework note (verified Aug 2026):** Next.js 16 renamed `middleware.ts` to **`proxy.ts`** (exported
function renamed `middleware` → `proxy`); the old file is deprecated. `proxy.ts` now defaults to (and can
only run on) the **Node.js runtime** — the historical "Edge-only middleware" constraint no longer applies
at the platform level. We still design `proxy.ts` to be DB-free and read only the already-decoded JWT,
because:

1. It runs on *every* matched request, so keeping it a cheap, synchronous check (not a DB round trip) is
   good practice regardless of runtime, and
2. Auth.js's own guidance is that proxy/middleware-only gating is not sufficient defense-in-depth — every
   Server Action and Route Handler must independently re-verify the session (see §8).

**Split-config pattern** (Auth.js v5), keeping `bcryptjs`/Prisma out of the request-gating path:

```
auth.config.ts   — edge/proxy-safe subset: pages, authorized() callback only, no providers
auth.ts          — full config: authConfig + CredentialsProvider (bcryptjs + Prisma), jwt/session callbacks
proxy.ts         — export { auth as proxy } from "@/auth"; matcher: ["/admin/:path*", "/coordinator/:path*"]
```

- `session: { strategy: "jwt" }` — required, and sufficient, since there is no DB adapter at all (no
  Account/Session tables — there's nothing for an adapter to manage; Students never log in, so the only
  accounts are Admin/Coordinator rows in our own `User` table).
- `authorize()` looks up `User` by email, compares `passwordHash` with bcryptjs, returns `{ id, role }` on
  success.
- `jwt()` callback embeds `role` into the token; `session()` callback exposes it on `session.user.role`.
- `proxy.ts`'s `authorized()` callback reads `auth.user.role` from the token and enforces:
  `/admin/*` → `ADMIN` only; `/coordinator/*` → `ADMIN` or `COORDINATOR`. Everything else (the public
  leaderboard routes) is unauthenticated and untouched by `proxy.ts`.

## 3. Database: Neon

**Vercel Postgres is discontinued** (Vercel migrated all existing Vercel Postgres databases to Neon in
Q4 2024–Q1 2025 and stopped offering new Vercel Postgres instances; the `@vercel/postgres` driver is
unmaintained). Provision Neon directly via the **Vercel Marketplace → Neon integration**, which sets the
connection env vars automatically.

- **Runtime connection**: Neon's **pooled** connection string (`-pooler` hostname), used by
  `@prisma/adapter-neon` at request time.
- **Migrations**: Neon's **direct/unpooled** connection string, set as `directUrl` in `prisma.config.ts` —
  DDL against a transaction-mode pooler is unreliable, so migrations bypass the pooler.
- **Cold starts**: Neon's dev-tier compute auto-suspends when idle; the first request after a quiet period
  can take ~1s longer. Expected behavior, not a bug — worth knowing before a demo.

## 4. Data Access Layer (Prisma 7)

Prisma 7 dropped the Rust query engine by default and **requires a driver adapter** — there is no more
"just set `url` in `datasource db`." Config:

```prisma
generator client {
  provider        = "prisma-client"
  output          = "../generated/prisma"
  previewFeatures = ["partialIndexes"]   // needed for the correction-pattern partial unique index
}
```

- `@prisma/adapter-neon` wraps Neon's serverless driver; instantiate once in `lib/prisma.ts` behind a
  `globalThis` guard (standard singleton pattern) so a warm Vercel Fluid Compute instance reuses one
  client across invocations instead of exhausting connections.
- `prisma.config.ts` (not schema-embedded) holds the CLI/migration connection info (`directUrl`).
- **Never import the generated Prisma client (or `bcryptjs`) into `proxy.ts`** — keep it thin and DB-free
  per §2.
- `partialIndexes` preview feature is required for the correction schema's
  `@@unique([...], where: raw(...))` index — see [data-model.md](./data-model.md#point-corrections). Small
  risk surface as a preview feature; scoped to one index on one model.

## 5. API Design: Server Actions vs. Route Handlers

| Use case | Mechanism | Why |
|---|---|---|
| Admin CRUD (Teams, Students, Criteria, Activities, assignments, users) | Server Action | Colocated with the form, no separate API contract to maintain |
| Coordinator point-logging + corrections | Server Action | Same reasoning; role/scope check happens inline (§8) |
| Public leaderboard (`GET /api/leaderboard`) | Route Handler | SWR needs a GET-able URL to poll |
| Public per-Activity breakdown (`GET /api/activities/[id]/breakdown`) | Route Handler | Same reasoning |

Public Route Handlers set `export const dynamic = "force-dynamic"` so Vercel's data cache never serves a
stale aggregate between polls — freshness matters more than cache hit rate here, and the query itself is
cheap (indexed, filtered aggregation over a small dataset).

## 6. The Leaderboard Aggregator

One function, [data-model.md](./data-model.md#pointentry-team-level--the-only-table-the-leaderboard-reads):

```ts
// lib/leaderboard.ts — has zero knowledge of specific Activity/Criteria names.
// Reused by the overall leaderboard AND every per-Activity/per-Criterion breakdown.
async function currentTeamTotals(extraWhere: Prisma.PointEntryWhereInput = {}) {
  return prisma.pointEntry.groupBy({
    by: ["teamId"],
    where: {
      supersededBy: null,           // exclude corrected/superseded rows
      activity: { visible: true },  // visibility enforced here, not in the UI
      criterion: { visible: true },
      ...extraWhere,                // e.g. { activityId } or { criterionId } for a breakdown view
    },
    _sum: { points: true },
  });
}
```

- The overall leaderboard calls `currentTeamTotals()`.
- A per-Activity breakdown calls `currentTeamTotals({ activityId })`, then groups further by `criterionId`
  in a second query (or a compound `groupBy(["teamId", "criterionId"])`) for the per-Criterion view.
- `StudentPointEntry` is never referenced by this function or anything that calls it — see
  [data-model.md](./data-model.md#student-level-points-do-not-roll-up) for why that's structural, not a
  convention.
- Adding a new Activity or Criterion requires zero changes to this function — it's parameterized entirely
  by IDs it's handed, never by name.

## 7. Real-Time Strategy: Polling, Not Websockets

Vercel serverless/edge functions are request-scoped and cannot hold a long-lived connection open, so a
self-hosted websocket server is off the table for v1 (constraint #0). Instead:

- Public leaderboard/breakdown pages use **SWR** with `refreshInterval: 10_000` (10s — reasonable for a
  live bootcamp scoreboard; not so aggressive it creates needless DB load against a pooled serverless
  connection).
- `revalidateOnFocus: true`, `refreshWhenHidden: false` — a backgrounded/inactive browser tab stops
  polling.
- Admin/Coordinator dashboards don't need interval polling — they call `mutate()` (SWR) or rely on Server
  Action + `revalidatePath()` to refresh immediately after their own writes.

If sub-second latency is ever required post-v1, the natural upgrade path is a managed pub/sub service
(e.g. Pusher, Ably, or Vercel's own realtime offerings if available) — deliberately not built now, per
constraint #0.

## 8. Visibility & Authorization Enforcement

Two independent layers, both server-side, neither trusting the other:

1. **Route gating** (`proxy.ts`): coarse-grained — is this a logged-in Admin/Coordinator allowed anywhere
   near `/admin` or `/coordinator`? No DB call, JWT-only.
2. **Per-request re-verification** (every Server Action and Route Handler): fine-grained —
   - Re-checks `auth()` session + `role` even though `proxy.ts` already gated the route (Auth.js's own
     guidance: proxy/middleware gating alone is not sufficient, and Server Actions are invoked as POSTs to
     their own route, which a `matcher` can accidentally miss).
   - For Coordinator writes specifically: re-checks `ActivityCoordinator` membership for the exact
     `activityId` being written to — this is the concrete mechanism behind
     [spec.md §4.2](./spec.md#42-coordinator-scope-is-enforced-server-side).
   - For public reads: the Prisma `where` clause itself filters `visible: true` (§6) — there is no code
     path where a hidden Activity/Criterion is fetched and then hidden in the UI; it's never fetched at
     all. This satisfies
     [spec.md §4.1](./spec.md#41-visibility-is-enforced-at-the-datajaquery-layer) — a hidden row can't leak
     into raw JSON if the query never returns it.

## 9. Folder Structure

```
app/
  (public)/                    -- no auth, no proxy gating
    page.tsx                   -- leaderboard
    activities/[id]/page.tsx   -- per-Activity breakdown
  admin/                       -- gated by proxy.ts, role=ADMIN
    teams/  students/  criteria/  activities/  coordinators/  users/
  coordinator/                 -- gated by proxy.ts, role=ADMIN|COORDINATOR
    activities/[id]/page.tsx   -- point-logging form, scoped to assigned Activities
  login/page.tsx
  api/
    leaderboard/route.ts
    activities/[id]/breakdown/route.ts
lib/
  prisma.ts                    -- singleton PrismaClient + adapter-neon
  leaderboard.ts                -- currentTeamTotals() aggregator (§6)
  auth-guards.ts                -- shared "assert Coordinator owns this Activity" helper
auth.ts / auth.config.ts / proxy.ts   -- see §2
prisma/schema.prisma
prisma.config.ts
```

## 10. Environment Variables

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled connection string (runtime) |
| `DIRECT_URL` | Neon direct/unpooled connection string (migrations only) |
| `AUTH_SECRET` | Auth.js JWT signing secret (`npx auth secret`) |
| `NEXTAUTH_URL` / `AUTH_URL` | canonical app URL (only strictly required in some deploy setups; set to be safe) |

All provisioned automatically by the Vercel↔Neon Marketplace integration except `AUTH_SECRET`, which is
generated once and set as a Vercel project env var.

## 11. Deployment Steps (for tasks.md Phase 0 / final Phase)

1. `vercel link` the project (or connect the GitHub repo in the Vercel dashboard).
2. Add the **Neon** integration from the Vercel Marketplace — this provisions `DATABASE_URL`/`DIRECT_URL`
   automatically for all environments (Production/Preview/Development).
3. Set `AUTH_SECRET` as a Vercel env var.
4. `prisma migrate deploy` runs as part of the Vercel build step (add to `package.json` `build` script).
5. Seed one initial Admin user via a one-off script (`prisma/seed.ts`), run manually against Production
   the first time — no self-registration exists, so there must be a way to create the first account.

## 12. Risks / Gotchas to Carry Into Implementation

- `partialIndexes` is a Prisma **preview feature** — confirm it still works as expected when
  `prisma migrate dev` first runs; fall back to a raw SQL migration for the partial unique index if the
  preview feature misbehaves.
- Native `bcrypt` is avoided entirely in favor of `bcryptjs` for Vercel build reliability (see Tech Stack
  table) — don't swap this without reason.
- Don't let `proxy.ts`'s `matcher` accidentally exclude a Server Action call issued from a gated page —
  Server Actions post back to the page's own route, so gating whole route groups (`/admin/:path*`) is
  safer than gating specific sub-paths.
- Neon dev-tier cold starts (~1s) are expected on the first poll after idle time — don't chase this as a
  perf bug.
