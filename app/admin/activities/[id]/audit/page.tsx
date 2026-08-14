import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
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

export default async function ActivityAuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [activity, pointEntries, studentPointEntries] = await Promise.all([
    prisma.activity.findUnique({ where: { id } }),
    prisma.pointEntry.findMany({
      where: { activityId: id },
      include: { team: true, criterion: true, awardedBy: true, supersededBy: { select: { id: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.studentPointEntry.findMany({
      where: { activityId: id },
      include: { student: true, criterion: true, awardedBy: true, supersededBy: { select: { id: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!activity) notFound();

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <Link href={`/admin/activities/${activity.id}`} className="text-muted-foreground text-sm hover:underline">
          ← Back to {activity.name}
        </Link>
        <h1 className="text-2xl font-semibold">Audit Trail — {activity.name}</h1>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">Team Points</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Criterion</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Awarded By</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pointEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.team.name}</TableCell>
                <TableCell>{entry.criterion.name}</TableCell>
                <TableCell>{entry.points}</TableCell>
                <TableCell>{entry.awardedBy.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {entry.createdAt.toLocaleString()}
                </TableCell>
                <TableCell>
                  {entry.supersededBy ? (
                    <Badge variant="secondary">Superseded</Badge>
                  ) : entry.supersedesId ? (
                    <Badge>Correction — current</Badge>
                  ) : (
                    <Badge>Current</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {pointEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  No Team points logged yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">Individual Points</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Criterion</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Awarded By</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentPointEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.student.name}</TableCell>
                <TableCell>{entry.criterion.name}</TableCell>
                <TableCell>{entry.points}</TableCell>
                <TableCell>{entry.awardedBy.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {entry.createdAt.toLocaleString()}
                </TableCell>
                <TableCell>
                  {entry.supersededBy ? (
                    <Badge variant="secondary">Superseded</Badge>
                  ) : entry.supersedesId ? (
                    <Badge>Correction — current</Badge>
                  ) : (
                    <Badge>Current</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {studentPointEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  No individual points logged yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
