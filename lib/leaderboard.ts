import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Zero knowledge of specific Activity/Criteria names — reused by the overall
// leaderboard and every per-Activity/per-Criterion breakdown (plan.md §6).
export async function currentTeamTotals(extraWhere: Prisma.PointEntryWhereInput = {}) {
  return prisma.pointEntry.groupBy({
    by: ["teamId"],
    where: {
      supersededBy: null,
      activity: { visible: true },
      criterion: { visible: true },
      ...extraWhere,
    },
    _sum: { points: true },
  });
}
