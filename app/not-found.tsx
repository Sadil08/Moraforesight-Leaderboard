import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <Image src="/brand/spark.png" alt="" width={44} height={46} className="opacity-60" />
      <h1 className="font-display text-lg tracking-wide">Not found</h1>
      <Link
        href="/"
        className="text-muted-foreground inline-flex items-center gap-1.5 text-sm transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to the leaderboard
      </Link>
    </div>
  );
}
