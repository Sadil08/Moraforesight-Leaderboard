"use server";

import { revalidatePath } from "next/cache";

import { getCoordinatorActivityAccess } from "@/lib/auth-guards";
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

export async function logStudentPoints(
  activityId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getCoordinatorActivityAccess(activityId);
  if (!session) {
    return { status: "error", error: "You are not assigned to this Activity." };
  }

  const studentId = formData.get("studentId");
  const criterionId = formData.get("criterionId");
  const rawPoints = formData.get("points");
  const note = formData.get("note");

  if (typeof studentId !== "string" || !studentId) {
    return { status: "error", error: "Select a student." };
  }
  if (typeof criterionId !== "string" || !criterionId) {
    return { status: "error", error: "Select a criterion." };
  }
  const points = typeof rawPoints === "string" ? Number(rawPoints) : NaN;
  if (!Number.isInteger(points)) {
    return { status: "error", error: "Point value must be a whole number." };
  }

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
  } catch {
    return {
      status: "error",
      error: "This Student/Criterion pair was already logged for this Activity — use a correction instead.",
    };
  }

  revalidatePath(`/coordinator/activities/${activityId}`);
  return { status: "success" };
}
