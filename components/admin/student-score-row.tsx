"use client";

import { useActionState, useState } from "react";

import { idleState } from "@/lib/actions/action-state";
import { correctStudentPointEntry } from "@/lib/actions/points";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";

type Entry = {
  id: string;
  activityName: string;
  criterionName: string;
  points: number;
  awardedByName: string;
  createdAt: string;
};

export function StudentScoreRow({ entry }: { entry: Entry }) {
  const [editing, setEditing] = useState(false);
  const action = correctStudentPointEntry.bind(null, entry.id);
  const [state, formAction, pending] = useActionState(action, idleState);
  const [prevStatus, setPrevStatus] = useState(state.status);

  if (state.status !== prevStatus) {
    setPrevStatus(state.status);
    if (state.status === "success") setEditing(false);
  }

  return (
    <TableRow>
      <TableCell>{entry.activityName}</TableCell>
      <TableCell>{entry.criterionName}</TableCell>
      <TableCell>
        {editing ? (
          <form action={formAction} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Input
                name="points"
                type="number"
                defaultValue={entry.points}
                className="w-20"
                aria-label={`Points for ${entry.criterionName} in ${entry.activityName}`}
                autoFocus
              />
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
            {state.status === "error" && <span className="text-destructive text-xs">{state.error}</span>}
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <span>{entry.points}</span>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </div>
        )}
      </TableCell>
      <TableCell>{entry.awardedByName}</TableCell>
      <TableCell className="text-muted-foreground text-sm">{entry.createdAt}</TableCell>
    </TableRow>
  );
}
