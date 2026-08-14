import Link from "next/link";

import { ActivityCreateDialog } from "@/components/admin/activity-create-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

export default async function AdminActivitiesPage() {
  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { activityCriteria: true, activityCoordinators: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Activities</h1>
        <ActivityCreateDialog />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Criteria</TableHead>
            <TableHead>Coordinators</TableHead>
            <TableHead>Visibility</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell className="font-medium">
                <Link href={`/admin/activities/${activity.id}`} className="hover:underline">
                  {activity.name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{activity.durationType === "SESSION" ? "Session" : "Game"}</Badge>
              </TableCell>
              <TableCell>{activity._count.activityCriteria}</TableCell>
              <TableCell>{activity._count.activityCoordinators}</TableCell>
              <TableCell>
                <Badge variant={activity.visible ? "default" : "secondary"}>
                  {activity.visible ? "Visible" : "Hidden"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {activities.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground text-center">
                No activities yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
