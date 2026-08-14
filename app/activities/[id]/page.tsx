import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ActivityBreakdown } from "@/components/public/activity-breakdown";
import { prisma } from "@/lib/prisma";

// An Activity's visibility can be toggled at any time via the Admin UI —
// never statically prerender this page.
export const dynamic = "force-dynamic";

export default async function PublicActivityBreakdownPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const activity = await prisma.activity.findFirst({ where: { id, visible: true } });
  if (!activity) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 pt-10 pb-16 sm:px-8 sm:pt-16">
      <Link
        href="/"
        className="text-muted-foreground inline-flex w-fit items-center gap-1.5 text-sm transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Leaderboard
      </Link>

      <div className="flex flex-col items-center gap-2 text-center">
        <span className="shrink-0 rounded-md bg-white/8 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
          {activity.durationType === "GAME" ? "Game" : "Session"}
        </span>
        <h1 className="font-display text-gradient-brand text-3xl leading-tight sm:text-4xl">
          {activity.name}
        </h1>
      </div>

      <ActivityBreakdown activityId={activity.id} />
    </div>
  );
}
