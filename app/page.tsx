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
    <>
      {/* Ambient background mascots, always present — sunk behind the content
          layer with a negative z-index so the glass cards' backdrop-blur
          picks them up and shows through as soft, blurred color. */}
      <Image
        src="/brand/character-girl.png"
        alt=""
        width={436}
        height={1100}
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-0 z-0 h-auto w-[42vw] max-w-[190px] opacity-80 drop-shadow-[0_0_60px_oklch(0.56_0.27_311/0.45)] [mask-image:radial-gradient(130%_130%_at_0%_100%,black_50%,transparent_92%)] sm:w-[30vw] sm:max-w-[230px] sm:opacity-90 lg:w-[22vw] lg:max-w-[300px] xl:w-[18vw] xl:max-w-[350px] xl:opacity-100"
      />
      <Image
        src="/brand/character-boy.png"
        alt=""
        width={1029}
        height={1062}
        aria-hidden
        className="pointer-events-none fixed right-0 bottom-0 z-0 h-auto w-[32vw] max-w-[150px] opacity-80 drop-shadow-[0_0_60px_oklch(0.75_0.165_62/0.5)] [mask-image:radial-gradient(130%_130%_at_100%_100%,black_50%,transparent_92%)] sm:w-[24vw] sm:max-w-[190px] sm:opacity-90 lg:w-[18vw] lg:max-w-[240px] xl:w-[15vw] xl:max-w-[280px] xl:opacity-100"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-5 pt-10 pb-16 sm:gap-14 sm:px-8 sm:pt-16">
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
            <h1 className="font-display text-gradient-brand text-[clamp(1.1rem,6.2vw,3rem)] leading-none tracking-tight whitespace-nowrap">
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
                    <span className="flex min-w-0 items-center gap-3">
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
          <p className="text-muted-foreground/70 text-xs">
            Presented by IEEE Student Branch &middot; University of Moratuwa
          </p>
        </footer>
      </div>
    </>
  );
}
