import { SignOutButton } from "@/components/sign-out-button";
import { requireCoordinatorOrAdmin } from "@/lib/auth-guards";

// Every coordinator page reads live, per-request DB/session state — never
// statically prerender this subtree.
export const dynamic = "force-dynamic";

export default async function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  await requireCoordinatorOrAdmin();

  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="text-sm font-medium">Coordinator</span>
        <SignOutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
