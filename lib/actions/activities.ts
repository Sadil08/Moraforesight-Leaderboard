"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/actions/action-state";

const activitySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z
    .string()
    .trim()
    .nullish()
    .transform((value) => (value ? value : undefined)),
  durationType: z.enum(["SESSION", "GAME"]),
  // .nullish() (not .optional()) because formData.get() returns null, not
  // undefined, for a field that isn't present in the submitted form at all
  // (e.g. the create dialog doesn't render every optional field).
  startAt: z
    .string()
    .trim()
    .nullish()
    .transform((value) => (value ? new Date(value) : undefined)),
});

function parseActivityForm(formData: FormData) {
  return activitySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    durationType: formData.get("durationType"),
    startAt: formData.get("startAt"),
  });
}

export async function createActivity(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = parseActivityForm(formData);
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0].message };
  }

  const activity = await prisma.activity.create({
    data: { ...parsed.data, visible: formData.get("visible") === "on" },
  });
  revalidatePath("/admin/activities");
  redirect(`/admin/activities/${activity.id}`);
}

export async function updateActivity(
  activityId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = parseActivityForm(formData);
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0].message };
  }

  await prisma.activity.update({
    where: { id: activityId },
    data: { ...parsed.data, visible: formData.get("visible") === "on" },
  });
  revalidatePath("/admin/activities");
  revalidatePath(`/admin/activities/${activityId}`);
  return { status: "success" };
}

const attachSchema = z.object({
  criterionId: z.string().trim().min(1, "Criterion is required"),
  pointValue: z.coerce.number().int("Point value must be a whole number"),
});

export async function attachCriterion(
  activityId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = attachSchema.safeParse({
    criterionId: formData.get("criterionId"),
    pointValue: formData.get("pointValue"),
  });
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0].message };
  }

  await prisma.activityCriterion.create({
    data: { activityId, criterionId: parsed.data.criterionId, pointValue: parsed.data.pointValue },
  });
  revalidatePath(`/admin/activities/${activityId}`);
  return { status: "success" };
}

export async function updateCriterionPointValue(
  activityId: string,
  criterionId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = z.coerce.number().int("Point value must be a whole number").safeParse(formData.get("pointValue"));
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0].message };
  }

  await prisma.activityCriterion.update({
    where: { activityId_criterionId: { activityId, criterionId } },
    data: { pointValue: parsed.data },
  });
  revalidatePath(`/admin/activities/${activityId}`);
  return { status: "success" };
}

export async function detachCriterion(activityId: string, criterionId: string) {
  await requireAdmin();

  await prisma.activityCriterion.delete({
    where: { activityId_criterionId: { activityId, criterionId } },
  });
  revalidatePath(`/admin/activities/${activityId}`);
}

export async function assignCoordinator(activityId: string, formData: FormData) {
  await requireAdmin();

  const coordinatorId = formData.get("coordinatorId");
  if (typeof coordinatorId !== "string" || !coordinatorId) return;

  await prisma.activityCoordinator.create({ data: { activityId, coordinatorId } });
  revalidatePath(`/admin/activities/${activityId}`);
}

export async function unassignCoordinator(activityId: string, coordinatorId: string) {
  await requireAdmin();

  await prisma.activityCoordinator.delete({
    where: { activityId_coordinatorId: { activityId, coordinatorId } },
  });
  revalidatePath(`/admin/activities/${activityId}`);
}
