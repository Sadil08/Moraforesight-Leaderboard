"use client";

import { useActionState } from "react";

import { idleState } from "@/lib/actions/action-state";
import { logStudentPoints } from "@/lib/actions/points";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Student = { id: string; name: string; teamName: string };
type Criterion = { criterionId: string; name: string };
type Entry = { id: string; studentName: string; criterionName: string; points: number };

export function StudentPointsSection({
  activityId,
  students,
  criteria,
  entries,
}: {
  activityId: string;
  students: Student[];
  criteria: Criterion[];
  entries: Entry[];
}) {
  const action = logStudentPoints.bind(null, activityId);
  const [state, formAction, pending] = useActionState(action, idleState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Individual Recognition (optional)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Recognizes an individual Student&apos;s contribution. Never counts toward the Team leaderboard.
        </p>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="studentId">Student</Label>
            <Select name="studentId" required>
              <SelectTrigger id="studentId" className="w-48">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} ({student.teamName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="criterionId">Criterion</Label>
            <Select name="criterionId" required>
              <SelectTrigger id="criterionId" className="w-40">
                <SelectValue placeholder="Select criterion" />
              </SelectTrigger>
              <SelectContent>
                {criteria.map((criterion) => (
                  <SelectItem key={criterion.criterionId} value={criterion.criterionId}>
                    {criterion.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="points">Points</Label>
            <Input id="points" name="points" type="number" className="w-20" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="note">Note (optional)</Label>
            <Input id="note" name="note" className="w-40" />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Logging…" : "Log"}
          </Button>
        </form>
        {state.status === "error" && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {entries.length > 0 && (
          <div className="flex flex-col gap-1 border-t pt-3">
            {entries.map((entry) => (
              <p key={entry.id} className="text-muted-foreground text-sm">
                {entry.studentName} — {entry.criterionName}: {entry.points} pts
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
