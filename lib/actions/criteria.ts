"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/actions/action-state";

const criterionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export async function createCriterion(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = criterionSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0].message };
  }

  await prisma.criterion.create({
    data: { ...parsed.data, visible: formData.get("visible") === "on" },
  });
  revalidatePath("/admin/criteria");
  return { status: "success" };
}

export async function updateCriterion(
  criterionId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = criterionSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0].message };
  }

  await prisma.criterion.update({
    where: { id: criterionId },
    data: { ...parsed.data, visible: formData.get("visible") === "on" },
  });
  revalidatePath("/admin/criteria");
  return { status: "success" };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by useActionState's action signature
export async function deleteCriterion(criterionId: string, _prevState: ActionState, _formData: FormData): Promise<ActionState> {
  await requireAdmin();

  try {
    // Detaching from Activities is safe cleanup, not audit history — do it
    // first so a criterion with no logged points can be removed outright.
    await prisma.activityCriterion.deleteMany({ where: { criterionId } });
    await prisma.criterion.delete({ where: { id: criterionId } });
  } catch {
    return {
      status: "error",
      error: "Points have already been logged against this criterion — hide it instead of deleting it.",
    };
  }

  revalidatePath("/admin/criteria");
  return { status: "success" };
}
