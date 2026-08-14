"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type BreakdownEntry = {
  team: { id: string; name: string; color: string | null };
  total: number;
  criteria: { criterionId: string; criterionName: string; points: number }[];
};

export function ActivityBreakdown({ activityId }: { activityId: string }) {
  const { data, isLoading } = useSWR<{ breakdown: BreakdownEntry[] }>(
    `/api/activities/${activityId}/breakdown`,
    fetcher,
    { refreshInterval: 10_000, revalidateOnFocus: true, refreshWhenHidden: false },
  );

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.breakdown
        .slice()
        .sort((a, b) => b.total - a.total)
        .map((entry) => (
          <div key={entry.team.id} className="glass-panel rounded-2xl p-4 ring-1 ring-white/10 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className="size-2.5 shrink-0 rounded-full ring-2 ring-white/20"
                  style={{ backgroundColor: entry.team.color ?? "var(--brand-purple)" }}
                />
                <span className="truncate text-base font-semibold sm:text-lg">{entry.team.name}</span>
              </span>
              <span className="font-display text-gradient-brand shrink-0 text-xl tabular-nums sm:text-2xl">
                {entry.total}
              </span>
            </div>
            {entry.criteria.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5 border-t border-white/10 pt-3">
                {entry.criteria.map((criterion) => (
                  <li
                    key={criterion.criterionId}
                    className="text-muted-foreground flex justify-between text-sm"
                  >
                    <span>{criterion.criterionName}</span>
                    <span className="tabular-nums">{criterion.points}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      {data.breakdown.length === 0 && (
        <p className="text-muted-foreground py-10 text-center text-sm">No teams yet.</p>
      )}
    </div>
  );
}
