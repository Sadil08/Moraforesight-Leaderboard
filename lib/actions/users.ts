"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/actions/action-state";

const userSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("A valid email is required"),
  role: z.enum(["ADMIN", "COORDINATOR"]),
});

export async function createUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0].message };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || password.length < 8) {
    return { status: "error", error: "Password must be at least 8 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { status: "error", error: "A user with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { ...parsed.data, passwordHash } });
  revalidatePath("/admin/users");
  return { status: "success" };
}

export async function setUserActive(userId: string, active: boolean) {
  const session = await requireAdmin();
  if (session.user.id === userId && !active) {
    // An Admin can't disable their own account out from under themselves.
    return;
  }

  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/admin/users");
}

const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("A valid email is required"),
});

export async function updateUser(
  userId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0].message };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing && existing.id !== userId) {
    return { status: "error", error: "A user with this email already exists." };
  }

  await prisma.user.update({ where: { id: userId }, data: parsed.data });
  revalidatePath("/admin/users");
  return { status: "success" };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by useActionState's action signature
export async function deleteUser(userId: string, _prevState: ActionState, _formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  if (session.user.id === userId) {
    return { status: "error", error: "You can't remove your own account." };
  }

  try {
    // Unassigning from Activities is safe cleanup, not audit history — do it
    // first so a coordinator with no logged points can be removed outright.
    await prisma.activityCoordinator.deleteMany({ where: { coordinatorId: userId } });
    await prisma.user.delete({ where: { id: userId } });
  } catch {
    return {
      status: "error",
      error: "This user has logged points on record and can't be removed — disable their account instead.",
    };
  }

  revalidatePath("/admin/users");
  return { status: "success" };
}
