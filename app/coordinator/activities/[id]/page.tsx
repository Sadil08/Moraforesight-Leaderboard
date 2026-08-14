import { notFound } from "next/navigation";

import { PointLoggingForm } from "@/components/coordinator/point-logging-form";
import { StudentPointsSection } from "@/components/coordinator/student-points-section";
import { getCoordinatorActivityAccess } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export default async function CoordinatorActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCoordinatorActivityAccess(id);
  if (!session) notFound();

  const [activity, teams, currentEntries, students, studentEntries] = await Promise.all([
    prisma.activity.findUnique({
      where: { id },
      include: { activityCriteria: { include: { criterion: true } } },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.pointEntry.findMany({
      where: { activityId: id, supersededBy: null },
      select: { id: true, teamId: true, criterionId: true, points: true },
    }),
    prisma.student.findMany({ orderBy: { name: "asc" }, include: { team: true } }),
    prisma.studentPointEntry.findMany({
      where: { activityId: id, supersededBy: null },
      include: { student: true, criterion: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!activity) notFound();

  const criteria = activity.activityCriteria.map((ac) => ({
    criterionId: ac.criterionId,
    name: ac.criterion.name,
    pointValue: ac.pointValue,
  }));

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">{activity.name}</h1>
      {criteria.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          This Activity has no Criteria attached yet — ask an Admin to attach some first.
        </p>
      ) : (
        <>
          <PointLoggingForm
            activityId={activity.id}
            teams={teams}
            criteria={criteria}
            existing={currentEntries}
          />
          <StudentPointsSection
            activityId={activity.id}
            students={students.map((s) => ({ id: s.id, name: s.name, teamName: s.team.name }))}
            criteria={criteria}
            entries={studentEntries.map((entry) => ({
              id: entry.id,
              studentName: entry.student.name,
              criterionName: entry.criterion.name,
              points: entry.points,
            }))}
          />
        </>
      )}
    </div>
  );
}
