"use client";

import { useActionState } from "react";
import Image from "next/image";

import { loginAction } from "@/lib/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-svh flex-1 items-center justify-center p-5 sm:p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-[oklch(0.56_0.27_311/0.3)] blur-3xl" />
          <Image
            src="/brand/spark.png"
            alt="MoraForesight"
            width={52}
            height={54}
            priority
            className="drop-shadow-[0_0_24px_oklch(0.56_0.27_311/0.4)]"
          />
        </div>

        <Card className="glow-ring w-full ring-1 ring-white/10">
          <CardHeader>
            <CardTitle className="font-display text-xl tracking-wide">Sign in</CardTitle>
            <CardDescription>Admin and Coordinator accounts only.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              {state?.error && (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={pending} className="h-10 w-full">
                {pending ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
