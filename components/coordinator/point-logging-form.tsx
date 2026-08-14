"use client";

import { useActionState } from "react";

import { idleState } from "@/lib/actions/action-state";
import { logPoints } from "@/lib/actions/points";
import { PointCell } from "@/components/coordinator/point-cell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Team = { id: string; name: string };
type Criterion = { criterionId: string; name: string; pointValue: number };
type ExistingEntry = { id: string; teamId: string; criterionId: string; points: number };

export function PointLoggingForm({
  activityId,
  teams,
  criteria,
  existing,
}: {
  activityId: string;
  teams: Team[];
  criteria: Criterion[];
  existing: ExistingEntry[];
}) {
  const action = logPoints.bind(null, activityId);
  const [state, formAction, pending] = useActionState(action, idleState);

  const existingMap = new Map(
    existing.map((entry) => [`${entry.teamId}_${entry.criterionId}`, { id: entry.id, points: entry.points }]),
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              {criteria.map((criterion) => (
                <TableHead key={criterion.criterionId}>{criterion.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium">{team.name}</TableCell>
                {criteria.map((criterion) => (
                  <TableCell key={criterion.criterionId}>
                    <PointCell
                      activityId={activityId}
                      teamId={team.id}
                      criterionId={criterion.criterionId}
                      pointValue={criterion.pointValue}
                      existing={existingMap.get(`${team.id}_${criterion.criterionId}`)}
                      label={`${team.name} — ${criterion.name}`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.status === "success" && (
        <Alert>
          <AlertDescription>Points logged.</AlertDescription>
        </Alert>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Logging…" : "Log Points"}
        </Button>
      </div>
    </form>
  );
}
