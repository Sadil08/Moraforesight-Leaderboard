import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold">Not found</h1>
      <Link href="/" className="text-sm underline">
        Back to the leaderboard
      </Link>
    </div>
  );
}
