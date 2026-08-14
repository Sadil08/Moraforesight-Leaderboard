"use server";

import { revalidatePath } from "next/cache";

import { getCoordinatorActivityAccess, requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/actions/action-state";

export async function logPoints(activityId: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getCoordinatorActivityAccess(activityId);
  if (!session) {
    return { status: "error", error: "You are not assigned to this Activity." };
  }

  const [activityCriteria, teams] = await Promise.all([
    prisma.activityCriterion.findMany({ where: { activityId } }),
    prisma.team.findMany(),
  ]);

  const toCreate: { teamId: string; criterionId: string; points: number }[] = [];
  for (const team of teams) {
    for (const ac of activityCriteria) {
      const raw = formData.get(`points_${team.id}_${ac.criterionId}`);
      if (typeof raw !== "string" || raw.trim() === "") continue;

      const points = Number(raw);
      if (!Number.isInteger(points)) {
        return { status: "error", error: "Point values must be whole numbers." };
      }
      toCreate.push({ teamId: team.id, criterionId: ac.criterionId, points });
    }
  }

  if (toCreate.length === 0) {
    return { status: "error", error: "Enter at least one point value." };
  }

  try {
    await prisma.$transaction(
      toCreate.map((entry) =>
        prisma.pointEntry.create({
          data: {
            activityId,
            criterionId: entry.criterionId,
            teamId: entry.teamId,
            points: entry.points,
            awardedById: session.user.id,
          },
        }),
      ),
    );
  } catch {
    return {
      status: "error",
      error:
        "One or more of these Team/Criterion pairs was already logged — refresh the page and use a correction instead.",
    };
  }

  revalidatePath(`/coordinator/activities/${activityId}`);
  return { status: "success" };
}

export async function correctPointEntry(
  activityId: string,
  entryId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getCoordinatorActivityAccess(activityId);
  if (!session) {
    return { status: "error", error: "You are not assigned to this Activity." };
  }

  const raw = formData.get("points");
  const points = typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isInteger(points)) {
    return { status: "error", error: "Point value must be a whole number." };
  }

  const original = await prisma.pointEntry.findUnique({ where: { id: entryId } });
  if (!original || original.activityId !== activityId) {
    return { status: "error", error: "Entry not found." };
  }

  try {
    await prisma.pointEntry.create({
      data: {
        activityId,
        criterionId: original.criterionId,
        teamId: original.teamId,
        points,
        awardedById: session.user.id,
        supersedesId: entryId,
      },
    });
  } catch {
    return {
      status: "error",
      error: "This entry was already corrected by someone else — refresh the page.",
    };
  }

  revalidatePath(`/coordinator/activities/${activityId}`);
  return { status: "success" };
}

// Admin-only view of a Student's individual score history — same
// append-only correction mechanism as correctPointEntry above (never a raw
// UPDATE), so this stays "edit" from the UI's perspective without breaking
// the immutable-audit-trail guarantee spec.md requires.
export async function correctStudentPointEntry(
  entryId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();

  const raw = formData.get("points");
  const points = typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isInteger(points)) {
    return { status: "error", error: "Point value must be a whole number." };
  }

  const original = await prisma.studentPointEntry.findUnique({ where: { id: entryId } });
  if (!original) {
    return { status: "error", error: "Entry not found." };
  }

  try {
    await prisma.studentPointEntry.create({
      data: {
        activityId: original.activityId,
        criterionId: original.criterionId,
        studentId: original.studentId,
        points,
        awardedById: session.user.id,
        supersedesId: entryId,
      },
    });
  } catch {
    return {
      status: "error",
      error: "This entry was already corrected — refresh the page.",
    };
  }

  revalidatePath(`/admin/students/${original.studentId}`);
  return { status: "success" };
}

export async function logStudentPoints(
  activityId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getCoordinatorActivityAccess(activityId);
  if (!session) {
    return { status: "error", error: "You are not assigned to this Activity." };
  }

  // One or more students — an ad-hoc subset picked by search, unrelated to
  // the real Team structure. Each gets its own independent StudentPointEntry
  // for the same Activity/Criterion/points, so one student already having an
  // entry doesn't block the rest of the batch.
  const studentIds = formData
    .getAll("studentIds")
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  const criterionId = formData.get("criterionId");
  const rawPoints = formData.get("points");
  const note = formData.get("note");

  if (studentIds.length === 0) {
    return { status: "error", error: "Select at least one student." };
  }
  if (typeof criterionId !== "string" || !criterionId) {
    return { status: "error", error: "Select a criterion." };
  }
  const points = typeof rawPoints === "string" ? Number(rawPoints) : NaN;
  if (!Number.isInteger(points)) {
    return { status: "error", error: "Point value must be a whole number." };
  }

  let succeeded = 0;
  for (const studentId of studentIds) {
    try {
      await prisma.studentPointEntry.create({
        data: {
          activityId,
          criterionId,
          studentId,
          points,
          note: typeof note === "string" && note ? note : undefined,
          awardedById: session.user.id,
        },
      });
      succeeded++;
    } catch {
      // This student already has an entry for this Activity/Criterion —
      // skip and keep going rather than aborting the whole batch.
    }
  }

  revalidatePath(`/coordinator/activities/${activityId}`);

  if (succeeded < studentIds.length) {
    const failed = studentIds.length - succeeded;
    return {
      status: "error",
      error: `Logged for ${succeeded} of ${studentIds.length} — ${failed} already had an entry for this criterion (use a correction instead).`,
    };
  }

  return { status: "success" };
}
