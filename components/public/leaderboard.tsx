"use client";

import { useState } from "react";
import useSWR from "swr";
import { Crown, Medal, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Team = { id: string; name: string; color: string | null; points: number; members: string[] };

const RANK_BADGE = [
  "bg-gradient-to-br from-[oklch(0.93_0.13_95)] to-[oklch(0.72_0.15_65)] text-[oklch(0.22_0.04_65)]",
  "bg-gradient-to-br from-[oklch(0.88_0.01_270)] to-[oklch(0.62_0.015_270)] text-[oklch(0.18_0_0)]",
  "bg-gradient-to-br from-[oklch(0.76_0.11_55)] to-[oklch(0.5_0.1_45)] text-[oklch(0.95_0.01_60)]",
];

const RANK_RING = [
  "ring-1 ring-[oklch(0.84_0.15_90/0.5)] shadow-[0_0_44px_-14px_oklch(0.84_0.15_90/0.6)]",
  "ring-1 ring-[oklch(0.8_0.01_270/0.4)] shadow-[0_0_32px_-16px_oklch(0.8_0.01_270/0.5)]",
  "ring-1 ring-[oklch(0.7_0.1_50/0.4)] shadow-[0_0_32px_-16px_oklch(0.7_0.1_50/0.5)]",
];

const RANK_ICON = [Crown, Trophy, Medal];

export function Leaderboard() {
  const { data, isLoading } = useSWR<{ leaderboard: Team[] }>("/api/leaderboard", fetcher, {
    refreshInterval: 10_000,
    revalidateOnFocus: true,
    refreshWhenHidden: false,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggle(teamId: string) {
    setExpandedId((prev) => (prev === teamId ? null : teamId));
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[4.5rem] animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {data.leaderboard.map((team, index) => {
        const Icon = RANK_ICON[index];
        const isOpen = expandedId === team.id;
        return (
          <li
            key={team.id}
            className={cn(
              "glass-panel overflow-hidden rounded-2xl transition-transform",
              index < 3 ? RANK_RING[index] : "ring-1 ring-white/10",
            )}
          >
            <button
              type="button"
              onClick={() => toggle(team.id)}
              aria-expanded={isOpen}
              aria-label={`${isOpen ? "Hide" : "Show"} ${team.name} members`}
              className="flex w-full cursor-pointer items-center gap-3 p-3.5 text-left transition-colors hover:bg-white/[0.04] sm:gap-4 sm:p-4"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-base font-bold sm:size-11 sm:text-lg",
                  index < 3 ? RANK_BADGE[index] : "bg-white/8 text-muted-foreground",
                )}
              >
                {Icon ? <Icon className="size-4.5 sm:size-5" strokeWidth={2.25} /> : index + 1}
              </span>

              <span
                className="size-2.5 shrink-0 rounded-full ring-2 ring-white/20"
                style={{ backgroundColor: team.color ?? "var(--brand-purple)" }}
              />

              <span className="min-w-0 flex-1 truncate text-base font-semibold sm:text-lg">
                {team.name}
              </span>

              <span className="font-display shrink-0 text-xl tabular-nums text-gradient-brand sm:text-2xl">
                {team.points}
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-white/10 px-4 pb-4 sm:px-5">
                {team.members.length > 0 ? (
                  <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 pt-3 text-sm">
                    {team.members.map((member, memberIndex) => (
                      <li key={`${member}-${memberIndex}`}>{member}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground pt-3 text-sm">No members yet.</p>
                )}
              </div>
            )}
          </li>
        );
      })}
      {data.leaderboard.length === 0 && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          No teams yet — check back once the bootcamp kicks off.
        </p>
      )}
    </ol>
  );
}
