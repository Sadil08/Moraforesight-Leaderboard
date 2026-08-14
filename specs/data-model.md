# Data Model

Companion to [spec.md](./spec.md) (what each entity is *for*) and [plan.md](./plan.md) (how it's queried).
Field lists here are the source of truth for the Prisma schema written in Phase 1 of
[tasks.md](./tasks.md).

## Entity-Relationship Overview

```
User (ADMIN | COORDINATOR)
  └─< ActivityCoordinator >─ Activity ─< ActivityCriterion >─ Criterion
                                │                                  │
                                │                                  │
                                └───────────< PointEntry >─────────┘
                                                  │
                                                Team
                                                  │
Team ──< Student
              │
              └───< StudentPointEntry >─── (Activity, Criterion)
```

- `Activity` is the single entity behind both "Sessions" and "Games" (`durationType` distinguishes them).
- `Criterion` is a global library, connected to `Activity` only through `ActivityCriterion` (which carries
  the per-Activity point value).
- `PointEntry` (Team-level, leaderboard-affecting) and `StudentPointEntry` (individual-level, non-rolling)
  are **separate tables by construction** — see [§ Student-level points do not roll up](#student-level-points-do-not-roll-up).

## Entities

### User

Admin and Coordinator accounts. No row exists for a "Student" — students have no login (see
[spec.md §8](./spec.md#8-open-questions--decisions-log)).

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id` | cuid |
| `name` | `String` | |
| `email` | `String @unique` | login identifier |
| `passwordHash` | `String` | bcryptjs hash, never returned by any query used in a JSON response |
| `role` | `Role` enum | `ADMIN` \| `COORDINATOR` |
| `createdAt` | `DateTime` | |

### Team

The unit ranked on the public leaderboard.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id` | |
| `name` | `String` | |
| `color` | `String?` | optional, for UI |
| `createdAt` | `DateTime` | |

### Student

A roster entry, not a login account. Belongs to exactly one Team for the whole bootcamp (static
membership — see [spec.md §8.1](./spec.md#8-open-questions--decisions-log)).

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id` | |
| `name` | `String` | |
| `teamId` | `String` | FK → Team, required |
| `photoUrl` | `String?` | optional |
| `createdAt` | `DateTime` | |

### Activity

The entity behind both "Sessions" and "Games" — see
[spec.md §3.1](./spec.md#31-admin). One model, one set of CRUD screens, one leaderboard aggregator; do not
build parallel Session/Game systems.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id` | |
| `name` | `String` | |
| `description` | `String?` | |
| `durationType` | `DurationType` enum | `SESSION` \| `GAME` — display/label only, no behavioral branching elsewhere |
| `visible` | `Boolean @default(true)` | enforced at query layer, see [plan.md §8](./plan.md#8-visibility--authorization-enforcement) |
| `startAt` | `DateTime?` | optional scheduling metadata |
| `createdAt` | `DateTime` | |

### Criterion

Global, reusable scoring dimension. Not owned by any single Activity.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id` | |
| `name` | `String` | e.g. "Creativity" |
| `description` | `String?` | |
| `visible` | `Boolean @default(true)` | independent of any Activity's visibility |
| `createdAt` | `DateTime` | |

### ActivityCriterion (join, with payload)

Which Criteria apply to a given Activity, and how many points that pairing is worth. This is what lets the
same Criterion be worth different points in different Activities.

| Field | Type | Notes |
|---|---|---|
| `activityId` | `String` | FK → Activity |
| `criterionId` | `String` | FK → Criterion |
| `pointValue` | `Int` | max/weight for this Activity+Criterion pairing |

`@@id([activityId, criterionId])`

### ActivityCoordinator (join)

The server-side source of truth for "which Coordinators may write points for which Activity" —
[spec.md §4.2](./spec.md#42-coordinator-scope-is-enforced-server-side). Every point-logging mutation
re-checks this table; it is never just a client-side filter.

| Field | Type | Notes |
|---|---|---|
| `activityId` | `String` | FK → Activity |
| `coordinatorId` | `String` | FK → User (role must be COORDINATOR) |

`@@id([activityId, coordinatorId])`

### PointEntry (Team-level — the only table the leaderboard reads)

One point award, or one correction of a prior award, against a `(Activity, Criterion, Team)` combination.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id` | |
| `activityId` | `String` | FK → Activity |
| `criterionId` | `String` | FK → Criterion |
| `teamId` | `String` | FK → Team |
| `points` | `Int` | |
| `note` | `String?` | optional coordinator note |
| `awardedById` | `String` | FK → User (the Coordinator/Admin who logged it) |
| `createdAt` | `DateTime` | |
| `supersedesId` | `String? @unique` | FK → PointEntry.id (self); see [Point Corrections](#point-corrections) |

Indexes: `[teamId]`, `[activityId, criterionId, teamId]`.

### StudentPointEntry (individual-level — never read by the leaderboard)

Structurally identical shape, but a **separate table**, not a nullable-`studentId` column on `PointEntry`.
This makes "individual points never affect the Team leaderboard" a schema-level guarantee — the generic
aggregation function in [plan.md §6](./plan.md#6-the-leaderboard-aggregator) literally cannot see this
table, rather than relying on every future query to remember to filter it out.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id` | |
| `activityId` | `String` | FK → Activity |
| `criterionId` | `String` | FK → Criterion |
| `studentId` | `String` | FK → Student |
| `points` | `Int` | |
| `note` | `String?` | |
| `awardedById` | `String` | FK → User |
| `createdAt` | `DateTime` | |
| `supersedesId` | `String? @unique` | same correction pattern as PointEntry |

## Point Corrections

Per [spec.md §4.3](./spec.md#43-point-corrections-are-additive-not-destructive): no `UPDATE`/`DELETE` is
ever issued against a point entry. A correction is a new row whose `supersedesId` points at the entry it
replaces.

**Two constraints do the correctness work, enforced at the database level (not just app logic):**

1. `supersedesId @unique` — a given entry can be superseded **at most once**. If two corrections race to
   supersede the same entry, the database's unique constraint lets only one `INSERT` succeed; the loser
   gets a unique-violation and the app surfaces "this was just corrected by someone else, refresh and
   retry."
2. A **partial unique index** on `(activityId, criterionId, teamId) WHERE supersedesId IS NULL` — at most
   one "root" (original, uncorrected) entry can exist per combination. This closes the other race: two
   people simultaneously creating two independent first-time entries for the same
   Activity/Criterion/Team, which would otherwise silently double-count. The second concurrent insert
   fails the same way, and the app redirects the user to correct the existing entry instead.

**"Current effective value"** for any `(Activity, Criterion, Team)` is simply: the `PointEntry` row with no
other row pointing back at it (`supersededBy IS NULL`, the inverse side of the `supersedesId` relation).
No recursive walk of the chain is needed to read the current value — only to display history/audit trail.

The identical pattern applies to `StudentPointEntry`, independently.

## Student-level points do not roll up

`PointEntry` (Team) and `StudentPointEntry` (individual) are unrelated tables — a `StudentPointEntry` row
has no foreign key into `PointEntry` and is never joined into any leaderboard/breakdown query. This is a
deliberate structural choice (see [plan.md §6](./plan.md#6-the-leaderboard-aggregator)): it makes the
"individual points are internal-only" requirement from
[spec.md §3.2](./spec.md#32-coordinator) impossible to violate by accident in a future query, rather than
a rule someone has to remember to apply.

## Enums

```
Role         = ADMIN | COORDINATOR
DurationType = SESSION | GAME
```
