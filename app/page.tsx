import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Leaderboard } from "@/components/public/leaderboard";
import { prisma } from "@/lib/prisma";

// The list of visible Activities can change at any time via the Admin UI —
// never statically prerender this page.
export const dynamic = "force-dynamic";

export default async function PublicLeaderboardPage() {
  const activities = await prisma.activity.findMany({
    where: { visible: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, durationType: true },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-5 pt-10 pb-16 sm:gap-14 sm:px-8 sm:pt-16">
      <header className="flex flex-col items-center gap-5 text-center">
        <div className="relative">
          <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-[oklch(0.56_0.27_311/0.35)] blur-3xl" />
          <Image
            src="/brand/spark.png"
            alt=""
            width={72}
            height={75}
            priority
            className="drop-shadow-[0_0_28px_oklch(0.56_0.27_311/0.45)]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-gradient-brand text-4xl leading-none tracking-tight sm:text-5xl">
            MORAFORESIGHT
          </h1>
          <p className="text-muted-foreground text-xs font-medium tracking-[0.3em] uppercase sm:text-sm">
            Bootcamp 4.0 &middot; Live Leaderboard
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[oklch(0.75_0.2_145)] opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-[oklch(0.75_0.2_145)]" />
          </span>
          Updating live
        </span>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="px-1 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Team Standings
        </h2>
        <Leaderboard />
      </section>

      {activities.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="px-1 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Activities
          </h2>
          <ul className="flex flex-col gap-2">
            {activities.map((activity) => (
              <li key={activity.id}>
                <Link
                  href={`/activities/${activity.id}`}
                  className="glass-panel group flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 ring-1 ring-white/10 transition-colors hover:bg-white/[0.06]"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 rounded-md bg-white/8 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                      {activity.durationType === "GAME" ? "Game" : "Session"}
                    </span>
                    <span className="truncate text-sm font-medium sm:text-base">{activity.name}</span>
                  </span>
                  <ArrowRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-auto flex flex-col items-center gap-3 pt-6">
        <Image
          src="/brand/ieee-white.png"
          alt="IEEE Student Branch, University of Moratuwa"
          width={160}
          height={35}
          className="opacity-50"
        />
        <p className="text-muted-foreground/70 text-xs">Presented by IEEE Student Branch &middot; University of Moratuwa</p>
      </footer>
    </div>
  );
}
