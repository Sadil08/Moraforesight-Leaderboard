import Link from "next/link";
import { notFound } from "next/navigation";

import { ActivityCoordinatorPicker } from "@/components/admin/activity-coordinator-picker";
import { ActivityCriteriaPicker } from "@/components/admin/activity-criteria-picker";
import { ActivityEditForm } from "@/components/admin/activity-edit-form";
import { prisma } from "@/lib/prisma";

export default async function AdminActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [activity, allCriteria, allCoordinators] = await Promise.all([
    prisma.activity.findUnique({
      where: { id },
      include: {
        activityCriteria: { include: { criterion: true } },
        activityCoordinators: { include: { coordinator: true } },
      },
    }),
    prisma.criterion.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "COORDINATOR", active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!activity) notFound();

  const attached = activity.activityCriteria.map((ac) => ({
    criterionId: ac.criterionId,
    name: ac.criterion.name,
    pointValue: ac.pointValue,
  }));
  const attachedIds = new Set(attached.map((a) => a.criterionId));
  const availableCriteria = allCriteria.filter((c) => !attachedIds.has(c.id));

  const assignedCoordinators = activity.activityCoordinators.map((ac) => ({
    id: ac.coordinator.id,
    name: ac.coordinator.name,
    email: ac.coordinator.email,
  }));
  const assignedIds = new Set(assignedCoordinators.map((c) => c.id));
  const availableCoordinators = allCoordinators.filter((c) => !assignedIds.has(c.id));

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{activity.name}</h1>
        <Link href={`/admin/activities/${activity.id}/audit`} className="text-sm text-muted-foreground hover:underline">
          View audit trail →
        </Link>
      </div>
      <ActivityEditForm activity={activity} />
      <ActivityCriteriaPicker activityId={activity.id} attached={attached} available={availableCriteria} />
      <ActivityCoordinatorPicker
        activityId={activity.id}
        assigned={assignedCoordinators}
        available={availableCoordinators}
      />
    </div>
  );
}
