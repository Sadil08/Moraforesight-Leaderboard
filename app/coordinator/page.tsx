import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function CoordinatorDashboardPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const activities = await prisma.activity.findMany({
    where: isAdmin ? undefined : { activityCoordinators: { some: { coordinatorId: session?.user.id } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Your Activities</h1>
      <div className="flex flex-col gap-2">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            href={`/coordinator/activities/${activity.id}`}
            className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
          >
            <span className="font-medium">{activity.name}</span>
            <Badge variant="outline">{activity.durationType === "SESSION" ? "Session" : "Game"}</Badge>
          </Link>
        ))}
        {activities.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No Activities assigned to you yet — ask an Admin to assign you to one.
          </p>
        )}
      </div>
    </div>
  );
}
