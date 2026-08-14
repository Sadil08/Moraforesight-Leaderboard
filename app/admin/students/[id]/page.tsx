import { notFound } from "next/navigation";

import { StudentScoreRow } from "@/components/admin/student-score-row";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: { team: true },
  });
  if (!student) notFound();

  const entries = await prisma.studentPointEntry.findMany({
    where: { studentId: id, supersededBy: null },
    include: { activity: true, criterion: true, awardedBy: true },
    orderBy: { createdAt: "desc" },
  });

  const total = entries.reduce((sum, entry) => sum + entry.points, 0);

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{student.name}</h1>
        <p className="text-muted-foreground text-sm">
          {student.team.name}
          {student.externalId ? ` · ${student.externalId}` : ""}
        </p>
      </div>
      <p className="text-sm">
        Individual recognition total: <span className="font-semibold">{total}</span> pts — never
        counts toward the Team leaderboard.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Activity</TableHead>
            <TableHead>Criterion</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>Awarded By</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <StudentScoreRow
              key={entry.id}
              entry={{
                id: entry.id,
                activityName: entry.activity.name,
                criterionName: entry.criterion.name,
                points: entry.points,
                awardedByName: entry.awardedBy.name,
                createdAt: entry.createdAt.toLocaleString(),
              }}
            />
          ))}
          {entries.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground text-center">
                No individual points logged for this student yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
