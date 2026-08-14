"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-svh flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-display text-lg tracking-wide">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">{error.message || "An unexpected error occurred."}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
