import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Re-verified independently in every gated layout and every Server Action —
// proxy.ts gating alone is not sufficient defense-in-depth (plan.md §8).

export async function requireAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/login");
  return session;
}

export async function requireCoordinatorOrAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN" && session?.user.role !== "COORDINATOR") redirect("/login");
  return session;
}

// The concrete mechanism behind spec.md §4.2: re-checks ActivityCoordinator
// membership for the *exact* activityId being written to, independent of
// anything the client sent or the UI hid. Admins bypass the assignment check
// (Admin has full read/write on everything, per spec.md §2). Returns null
// rather than redirecting/throwing so both pages (-> notFound()) and Server
// Actions (-> ActionState error) can decide how to surface the rejection.
export async function getCoordinatorActivityAccess(activityId: string) {
  const session = await auth();
  if (!session) return null;
  if (session.user.role === "ADMIN") return session;
  if (session.user.role !== "COORDINATOR") return null;

  const assignment = await prisma.activityCoordinator.findUnique({
    where: { activityId_coordinatorId: { activityId, coordinatorId: session.user.id } },
  });
  return assignment ? session : null;
}
