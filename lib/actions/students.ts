"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/actions/action-state";

const studentSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  teamId: z.string().trim().min(1, "Team is required"),
  photoUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export async function createStudent(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = studentSchema.safeParse({
    name: formData.get("name"),
    teamId: formData.get("teamId"),
    photoUrl: formData.get("photoUrl"),
  });
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0].message };
  }

  await prisma.student.create({ data: parsed.data });
  revalidatePath("/admin/students");
  return { status: "success" };
}

export async function updateStudent(
  studentId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = studentSchema.safeParse({
    name: formData.get("name"),
    teamId: formData.get("teamId"),
    photoUrl: formData.get("photoUrl"),
  });
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0].message };
  }

  await prisma.student.update({ where: { id: studentId }, data: parsed.data });
  revalidatePath("/admin/students");
  return { status: "success" };
}
