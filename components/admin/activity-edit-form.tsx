"use client";

import { useActionState } from "react";

import { idleState } from "@/lib/actions/action-state";
import { updateActivity } from "@/lib/actions/activities";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Activity = {
  id: string;
  name: string;
  description: string | null;
  durationType: "SESSION" | "GAME";
  visible: boolean;
  startAt: Date | null;
};

export function ActivityEditForm({ activity }: { activity: Activity }) {
  const action = updateActivity.bind(null, activity.id);
  const [state, formAction, pending] = useActionState(action, idleState);

  const startAtValue = activity.startAt
    ? new Date(activity.startAt.getTime() - activity.startAt.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={activity.name} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" name="description" defaultValue={activity.description ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="durationType">Type</Label>
              <Select name="durationType" defaultValue={activity.durationType} required>
                <SelectTrigger id="durationType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SESSION">Session</SelectItem>
                  <SelectItem value="GAME">Game</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="startAt">Start (optional)</Label>
              <Input id="startAt" name="startAt" type="datetime-local" defaultValue={startAtValue} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="visible" name="visible" defaultChecked={activity.visible} />
            <Label htmlFor="visible">Visible on the public leaderboard</Label>
          </div>
          {state.status === "error" && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
