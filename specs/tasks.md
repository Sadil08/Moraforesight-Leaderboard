# Task Breakdown

Ordered phases for implementing [spec.md](./spec.md) per [plan.md](./plan.md) and
[data-model.md](./data-model.md). **Build one phase at a time; pause for review after each phase** before
starting the next — don't build the whole app in one pass.

Each phase lists its goal, concrete steps, and what "done" looks like. Cross-references point back to the
spec section that phase satisfies, so review can check behavior against requirements, not just against
code.

---

## Phase 0 — Project Scaffolding

**Goal:** an empty but deployable Next.js app.

- `create-next-app` (App Router, TypeScript, Tailwind) on Next.js 16.
- Add shadcn/ui, initialize its config.
- Add ESLint/Prettier config.
- Set up the repo on GitHub, connect to a new Vercel project ([plan.md §11](./plan.md#11-deployment-steps-for-tasksmd-phase-0--final-phase) steps 1–3, minus the DB/env parts which land in Phase 1).
- **Done when:** `npm run dev` serves a blank page locally, and a push deploys successfully to a Vercel
  preview URL.

## Phase 1 — Database Schema & Prisma Setup

**Goal:** the full schema from [data-model.md](./data-model.md) exists and migrates cleanly against a real
Neon database.

- Provision Neon via the Vercel Marketplace integration ([plan.md §3](./plan.md#3-database-neon)).
- Write `prisma/schema.prisma` — all entities/enums/indexes from data-model.md, including the
  `partialIndexes` preview feature and the correction-pattern constraints
  ([data-model.md § Point Corrections](./data-model.md#point-corrections)).
- Write `prisma.config.ts` (direct URL for migrations, per [plan.md §4](./plan.md#4-data-access-layer-prisma-7)).
- `lib/prisma.ts` — singleton client with `@prisma/adapter-neon`.
- `prisma/seed.ts` — creates one initial Admin user (email/password from env or CLI prompt, hashed with
  bcryptjs). This is the *only* way an Admin account gets created before the Admin UI exists.
- Run `prisma migrate dev` locally against Neon; verify the partial unique index actually gets created as
  expected (flagged as a risk in [plan.md §12](./plan.md#12-risks--gotchas-to-carry-into-implementation)).
- **Done when:** migration applies cleanly, seed script creates a working Admin row, and a scratch script
  can insert/read a `PointEntry` plus a correction of it and confirm `currentTeamTotals()`-style query
  logic returns the corrected value only.

## Phase 2 — Auth (Admin/Coordinator Login)

**Goal:** Admin and Coordinator can log in; unauthenticated/wrong-role users are blocked from their areas.
Satisfies [spec.md §2](./spec.md#2-roles--access-model).

- `auth.config.ts` / `auth.ts` / `proxy.ts` per the split-config pattern in
  [plan.md §2](./plan.md#2-auth-architecture).
- Login page at `/login` (email + password form → Credentials provider).
- `proxy.ts` matcher gating `/admin/:path*` (ADMIN only) and `/coordinator/:path*` (ADMIN or COORDINATOR).
- Logout action.
- **Done when:** the seeded Admin can log in and reach `/admin`; a direct hit on `/admin` while logged out
  redirects to `/login`; a Coordinator account (create one manually via Prisma Studio for this test, since
  the Admin UI doesn't exist yet) can reach `/coordinator` but is blocked from `/admin`.

## Phase 3 — Admin: Teams & Students

**Goal:** Admin can manage the Team/Student roster. Satisfies the Teams/Students bullets of
[spec.md §3.1](./spec.md#31-admin).

- `/admin/teams` — list, create, edit Teams.
- `/admin/students` — list, create, edit Students, each assigned to one Team (dropdown).
- All mutations as Server Actions, re-checking `role === ADMIN` server-side even though `proxy.ts` already
  gated the route ([plan.md §8](./plan.md#8-visibility--authorization-enforcement)).
- **Done when:** an Admin can create a Team, create a Student under it, and see both reflected immediately
  (no manual refresh) via `revalidatePath`.

## Phase 4 — Admin: Criteria Library

**Goal:** Admin can manage the global, reusable Criteria library. Satisfies the Criteria bullet of
[spec.md §3.1](./spec.md#31-admin).

- `/admin/criteria` — list, create, edit Criteria (name, description, `visible` toggle).
- **Done when:** a Criterion created here is not yet attached to any Activity (that linking is Phase 5) but
  exists and its `visible` flag can be toggled.

## Phase 5 — Admin: Activities (Sessions/Games)

**Goal:** Admin can manage the single Activity entity that covers both Sessions and Games, including which
Criteria apply and at what point value. Satisfies the Activities and Visibility bullets of
[spec.md §3.1](./spec.md#31-admin).

- `/admin/activities` — list (with a durationType filter/badge, not two separate lists), create, edit.
- Activity edit page includes: `visible` toggle, and a Criteria-picker UI that manages `ActivityCriterion`
  rows (attach/detach a Criterion, set its `pointValue` for this Activity).
- **Done when:** an Admin can create one "Game" and one "Session" Activity from the *same* form, attach 2+
  Criteria to one with distinct point values, and toggle visibility on both the Activity and one of its
  attached Criteria independently.

## Phase 6 — Admin: Coordinator Assignment & User Management

**Goal:** Admin can create Coordinator/Admin accounts and assign Coordinators to specific Activities.
Satisfies the remaining bullets of [spec.md §3.1](./spec.md#31-admin) and
[spec.md §4.2](./spec.md#42-coordinator-scope-is-enforced-server-side).

- `/admin/users` — create Admin/Coordinator accounts (email + password; hash with bcryptjs before storing).
- Activity edit page (from Phase 5) gains a Coordinator-picker managing `ActivityCoordinator` rows.
- **Done when:** an Admin creates a Coordinator account, assigns them to exactly one Activity, and that
  Coordinator (logging in fresh) sees only that Activity in `/coordinator` — confirmed against the DB, not
  just the UI list.

## Phase 7 — Coordinator: Point Logging

**Goal:** Coordinators can log Team-level points for their assigned Activities — the primary,
leaderboard-affecting path. Satisfies the first point-logging bullet of
[spec.md §3.2](./spec.md#32-coordinator).

- `/coordinator/activities/[id]` — for an assigned Activity, a form to log points per Team per (attached)
  Criterion.
- Server Action re-verifies `ActivityCoordinator` membership for the exact `activityId` server-side before
  any write — this is the concrete implementation of
  [spec.md §4.2](./spec.md#42-coordinator-scope-is-enforced-server-side); test it by hand-crafting a
  request for an unassigned Activity and confirming it's rejected.
- **Done when:** a Coordinator can log points for each Team against each Criterion on their assigned
  Activity, and a direct attempt to log points on an *unassigned* Activity (via crafted request, not just
  hidden UI) is rejected server-side.

## Phase 8 — Corrections & Individual Student Points

**Goal:** the additive-correction workflow, plus the optional (non-rolling) individual Student point path.
Satisfies [spec.md §4.3](./spec.md#43-point-corrections-are-additive-not-destructive) and the second
point-logging bullet of [spec.md §3.2](./spec.md#32-coordinator).

- "Correct this entry" action on any existing `PointEntry` → creates a new row with `supersedesId` set,
  never edits/deletes the original ([data-model.md § Point Corrections](./data-model.md#point-corrections)).
- Handle the two DB-enforced race conditions gracefully in the UI (surface "already corrected, please
  refresh" / "an entry already exists here, correct it instead" rather than a raw 500).
- Optional individual-Student point form, writing to `StudentPointEntry` — visually/structurally separate
  from the Team form so it reads as the secondary path it is.
- An audit view (Admin-only, or Admin+Coordinator for their own Activities) showing the full correction
  history for an Activity.
- **Done when:** correcting a point entry updates the effective total without leaving the old row deleted
  or mutated (verify in the DB, not just the UI); an individual Student point entry does **not** change any
  Team's leaderboard total.

## Phase 9 — Public Leaderboard

**Goal:** the fully public, no-login, polling leaderboard. Satisfies
[spec.md §3.3](./spec.md#33-public-leaderboard-no-login).

- `lib/leaderboard.ts` — `currentTeamTotals()` per [plan.md §6](./plan.md#6-the-leaderboard-aggregator).
- `GET /api/leaderboard` and `GET /api/activities/[id]/breakdown` Route Handlers, `dynamic = "force-dynamic"`,
  applying visibility filtering in the query itself.
- `/` (public) — Team ranking, SWR `refreshInterval: 10_000`.
- `/activities/[id]` (public) — per-Criterion breakdown for one visible Activity.
- **Verify visibility enforcement directly against raw JSON**, not just the rendered page: hide an Activity
  and a Criterion via the Admin UI, then `curl` both Route Handlers and confirm neither the hidden
  Activity's data nor the hidden Criterion's name/id appears anywhere in the response
  ([spec.md §4.1](./spec.md#41-visibility-is-enforced-at-the-datajaquery-layer)).
- **Done when:** the leaderboard updates within one polling interval of a Coordinator logging a point, with
  no manual refresh, and the hidden-data check above passes.

## Phase 10 — Polish & Deployment Hardening

**Goal:** production-ready.

- Loading/empty/error states across Admin, Coordinator, and public views.
- Responsive layout check (the public leaderboard should work on a projector/shared-screen aspect ratio as
  well as mobile).
- Confirm `prisma migrate deploy` runs as part of the Vercel build ([plan.md §11](./plan.md#11-deployment-steps-for-tasksmd-phase-0--final-phase)).
- Confirm all env vars are set in Vercel (Production + Preview) per [plan.md §10](./plan.md#10-environment-variables).
- Run the seed script once against Production to create the real first Admin account; rotate/replace the
  password immediately after first login.
- **Done when:** a fresh `git push` to main produces a working Production deployment with real data,
  end to end, with no manual post-deploy steps beyond what's documented here.
