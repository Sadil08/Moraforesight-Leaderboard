import Link from "next/link";

import { StudentDialog } from "@/components/admin/student-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

export default async function AdminStudentsPage() {
  const [students, teams] = await Promise.all([
    prisma.student.findMany({
      orderBy: [{ team: { name: "asc" } }, { name: "asc" }],
      include: {
        team: true,
        studentPointEntries: { where: { supersededBy: null }, select: { points: true } },
      },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Students</h1>
        <StudentDialog teams={teams} />
      </div>
      {teams.length === 0 && (
        <p className="text-muted-foreground text-sm">Create a Team first before adding Students.</p>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Index #</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Score</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            const score = student.studentPointEntries.reduce((sum, entry) => sum + entry.points, 0);
            return (
              <TableRow key={student.id}>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  {student.externalId ?? "—"}
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/admin/students/${student.id}`} className="hover:underline">
                    {student.name}
                  </Link>
                </TableCell>
                <TableCell>{student.team.name}</TableCell>
                <TableCell>
                  <Link href={`/admin/students/${student.id}`} className="tabular-nums hover:underline">
                    {score}
                  </Link>
                </TableCell>
                <TableCell>
                  <StudentDialog student={student} teams={teams} />
                </TableCell>
              </TableRow>
            );
          })}
          {students.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground text-center">
                No students yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
