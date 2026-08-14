import { NextResponse } from "next/server";

import { currentTeamTotals } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [totals, teams] = await Promise.all([
    currentTeamTotals(),
    prisma.team.findMany({ select: { id: true, name: true, color: true } }),
  ]);

  const pointsByTeam = new Map(totals.map((total) => [total.teamId, total._sum.points ?? 0]));

  const leaderboard = teams
    .map((team) => ({ ...team, points: pointsByTeam.get(team.id) ?? 0 }))
    .sort((a, b) => b.points - a.points);

  return NextResponse.json({ leaderboard });
}
