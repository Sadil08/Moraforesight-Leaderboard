import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const activity = await prisma.activity.findFirst({ where: { id, visible: true } });
  if (!activity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [teams, breakdownRows] = await Promise.all([
    prisma.team.findMany({ select: { id: true, name: true, color: true } }),
    prisma.pointEntry.groupBy({
      by: ["teamId", "criterionId"],
      where: {
        supersededBy: null,
        activityId: id,
        activity: { visible: true },
        criterion: { visible: true },
      },
      _sum: { points: true },
    }),
  ]);

  const criterionIds = [...new Set(breakdownRows.map((row) => row.criterionId))];
  const criteria = await prisma.criterion.findMany({
    where: { id: { in: criterionIds } },
    select: { id: true, name: true },
  });
  const criterionNames = new Map(criteria.map((criterion) => [criterion.id, criterion.name]));

  const criteriaByTeam = new Map<string, { criterionId: string; criterionName: string; points: number }[]>();
  for (const row of breakdownRows) {
    const name = criterionNames.get(row.criterionId);
    if (!name) continue;
    const list = criteriaByTeam.get(row.teamId) ?? [];
    list.push({ criterionId: row.criterionId, criterionName: name, points: row._sum.points ?? 0 });
    criteriaByTeam.set(row.teamId, list);
  }

  const breakdown = teams.map((team) => {
    const rows = criteriaByTeam.get(team.id) ?? [];
    return {
      team,
      total: rows.reduce((sum, row) => sum + row.points, 0),
      criteria: rows,
    };
  });

  return NextResponse.json({
    activity: { id: activity.id, name: activity.name, durationType: activity.durationType },
    breakdown,
  });
}
