# MoraForesight Bootcamp Leaderboard — Functional Specification

## 1. Overview

A web application for running a team-based bootcamp: Admins configure the structure (Teams, Students,
Activities, Criteria, Coordinator assignments, visibility), Coordinators log points for the Activities
they're assigned to, and anyone with the link can watch a live, read-only Team leaderboard — no account
required.

The product is deliberately small in surface area: one entity ("Activity") covers both "Sessions" and
"Games," one global "Criteria" library is reused everywhere, and one aggregation function powers every
leaderboard/breakdown view. See [plan.md](./plan.md) for the technical architecture and
[data-model.md](./data-model.md) for entities and relationships.

## 2. Roles & Access Model

| Role | Has a login account? | Access |
|---|---|---|
| **Admin** | Yes (created by another Admin, or seeded initially) | Full read/write on everything |
| **Coordinator** | Yes (created by an Admin) | Read/write points only for Activities they're assigned to; read-only elsewhere |
| **Public ("Student view")** | **No** — no account, no login, no gate | Read-only, and only sees what's marked `visible` |

There is no "Student" user account. Students/the public view the leaderboard via a public URL with no
authentication step. This was an explicit decision (see §8) — it removes an entire class of account
management from v1 and matches the "show it on a shared screen during the bootcamp" use case.

Privilege is strictly increasing: Admin ⊇ Coordinator (scoped) ⊇ Public (visibility-filtered, read-only).

## 3. Functional Requirements

### 3.1 Admin

- **Teams**: create, edit, list Teams (name, optional color/avatar). Teams are the unit that appears on
  the public leaderboard.
- **Students**: create, edit, list Students as roster entries (name, optional photo) assigned to exactly
  one Team, for the duration of the bootcamp. Students are *not* user accounts — they exist so
  Coordinators can optionally attribute points to an individual within a team (§3.2).
- **Criteria**: create, edit, list a global, reusable Criteria library (name, description, `visible` flag).
  A Criterion is not tied to any single Activity — the same "Creativity" criterion can be used across many
  Activities, each time with its own point value.
- **Activities** (Sessions and Games are the same entity, see [data-model.md](./data-model.md#activity)):
  create, edit, list Activities with a `durationType` (`SESSION` | `GAME`), a `visible` flag, and:
  - which Criteria apply to this Activity, each with a **point value specific to this Activity**
    (an M:N link with a payload — see `ActivityCriterion`).
  - which Coordinators are assigned to log points for this Activity (`ActivityCoordinator`).
- **Visibility**: toggle `visible` independently on any Activity and on any Criterion. A hidden Activity
  or a hidden Criterion must never appear in a public response — see §4.1.
- **User management**: create/disable Admin and Coordinator accounts (email + password). Admins cannot be
  demoted/deleted by Coordinators (Coordinators have no access to user management at all).
- **Audit trail**: view the full, unredacted history of point entries and corrections for any Activity,
  including who logged what and when (Admins are not visibility-filtered).

### 3.2 Coordinator

- Sees only the Activities they are assigned to (via `ActivityCoordinator`) — both in navigation and in
  what a write request is allowed to target. This is enforced **server-side on every write**, not just
  hidden in the UI (see §4.2).
- For each assigned Activity, logs points **per Team, per Criterion** (the primary, leaderboard-affecting
  path).
- May *optionally* also log points to an individual Student within a Team, for the same Activity/Criterion.
  This is a secondary capability, used only when needed (e.g. recognizing an individual contribution).
  **Individual-level entries are tracked separately and never roll up into the Team total** — they don't
  affect the public leaderboard or Team ranking at all; they exist purely as an internal record visible to
  Admins/Coordinators. See [data-model.md](./data-model.md#student-level-points-do-not-roll-up) for why
  this is a schema-level guarantee, not just a query convention.
- Cannot edit or delete an existing point entry. To fix a mistake, a Coordinator submits a **correction**,
  which creates a new entry that supersedes the old one — the old entry is never mutated or removed (full
  audit trail). See [data-model.md](./data-model.md#point-corrections) for the mechanism.
- Cannot create/edit Teams, Students, Criteria, Activities, or Coordinator assignments.

### 3.3 Public Leaderboard (no login)

- **Team leaderboard**: ranks Teams by total points, summed across all *visible* Activities and *visible*
  Criteria, using only current (non-superseded) point entries. Individual/Student-level entries are never
  included (§3.2).
- **Per-Activity / per-Criterion breakdown**: for any visible Activity, shows each Team's point total
  broken down by visible Criterion, so a viewer can see *why* a Team has the score it has (subject to the
  same visibility filtering — a hidden Criterion's points are folded into the Team's total but the
  Criterion itself, and its label, are never exposed).
- Updates automatically via polling (no manual refresh needed) — see [plan.md §7](./plan.md#7-real-time-strategy-polling-not-websockets).
- Fully public: no login, no passcode. Anyone with the URL can view it (e.g., displayed on a shared screen
  during the bootcamp).

## 4. Cross-Cutting Requirements

### 4.1 Visibility is enforced at the data/query layer

A hidden Activity or a hidden Criterion must never appear in a public API response, **even in raw JSON** —
this is not a UI-only concern. Every public-facing read goes through the same query layer that filters on
`Activity.visible = true` and `Criterion.visible = true` before the response is ever serialized. See
[plan.md](./plan.md#8-visibility--authorization-enforcement) for the enforcement layer.

### 4.2 Coordinator scope is enforced server-side

Every write a Coordinator makes (`ActivityCoordinator` membership check) is re-validated in the
Server Action / Route Handler itself, independent of anything the client sent or the UI hid. A Coordinator
who is not assigned to Activity X cannot log a point for Activity X by any means, including a
hand-crafted request.

### 4.3 Point corrections are additive, not destructive

No `UPDATE` or `DELETE` is ever issued against a point entry once created. A correction is always a new
row referencing the entry it supersedes, so the full history of who-said-what-when is permanently
reconstructable. See [data-model.md](./data-model.md#point-corrections).

### 4.4 The leaderboard aggregator is loosely coupled

The aggregation logic that produces "current points per Team" has **zero knowledge of specific Activity or
Criteria names**. It is one generic function — "sum current, visible PointEntry rows, grouped by Team" —
reused for the overall leaderboard and for every per-Activity/per-Criterion breakdown, parameterized only
by an optional filter (e.g. `{ activityId }`). See [plan.md](./plan.md#6-the-leaderboard-aggregator).

## 5. Non-Functional Requirements

- **Deployment**: Vercel, Next.js only — no separate backend service, no self-hosted server.
- **Database**: serverless Postgres (Neon), pooled connection string — never SQLite.
- **Auth sessions**: JWT strategy (no DB-backed sessions/adapter) so the route-gating layer never makes a
  DB call.
- **Real-time**: polling-based (SWR interval), not websockets — Vercel functions can't hold a socket open.
- **Security**: passwords hashed (never stored/logged in plaintext); every mutation re-checks
  authorization server-side regardless of what the route-gating layer already allowed.

## 6. Out of Scope for v1

- Student accounts / student login of any kind.
- Multi-team membership per Student, or re-teaming between Activities (Team membership is static for the
  whole bootcamp — see §8).
- Email notifications, magic links, or any transactional email.
- Websocket/live-push updates (polling only, see §5).
- CSV/bulk import of Teams/Students (can be added later; v1 is admin-UI CRUD only).
- Multi-bootcamp / multi-tenant support (v1 is a single bootcamp instance).

## 7. Glossary

- **Activity** — the single entity underlying both "Sessions" and "Games," distinguished only by
  `durationType`.
- **Criterion** — a reusable scoring dimension (e.g. "Creativity") from the global library.
- **PointEntry** — one point award (or correction) against a `(Activity, Criterion, Team)` combination.
- **Superseded entry** — a `PointEntry` that has been replaced by a later correction; excluded from all
  totals but never deleted.
- **Visible** — a boolean flag on `Activity` and `Criterion` controlling public exposure.

## 8. Open Questions / Decisions Log

Decisions already made with the user during planning (recorded here so they aren't re-litigated):

1. **Team membership**: static for the entire bootcamp — a Student belongs to exactly one Team throughout.
   No per-Activity re-teaming in v1.
2. **Point target**: Team-level points are the only thing that counts toward the public leaderboard.
   Individual/Student-level point entries are an optional secondary capability, used only when needed, and
   are explicitly excluded from Team totals and from anything the public sees.
3. **Criteria model**: a global, reusable Criteria library, not per-Activity custom criteria. Each Activity
   selects which Criteria apply and sets a point value for that pairing.
4. **Auth / provisioning**: only Admin and Coordinator have login accounts, created directly by an Admin
   (email + password, no self-registration). Students do not log in — the leaderboard is public with no
   gate, no passcode.
5. **Database provider**: Neon (Vercel Postgres was discontinued in favor of Neon — see
   [plan.md §3](./plan.md#3-database-neon)).

No further open questions remain blocking for v1. Any new product decision that isn't already covered
above or elsewhere in this document should be raised with the user before implementation, per the working
agreement for this project.
