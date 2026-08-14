"use client";

import { useActionState, useState } from "react";

import { idleState } from "@/lib/actions/action-state";
import { correctPointEntry } from "@/lib/actions/points";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Existing = { id: string; points: number };

export function PointCell({
  activityId,
  teamId,
  criterionId,
  pointValue,
  existing,
  label,
}: {
  activityId: string;
  teamId: string;
  criterionId: string;
  pointValue: number;
  existing?: Existing;
  label: string;
}) {
  const [correcting, setCorrecting] = useState(false);

  if (!existing) {
    return (
      <Input
        name={`points_${teamId}_${criterionId}`}
        type="number"
        placeholder={String(pointValue)}
        className="w-20"
        aria-label={label}
      />
    );
  }

  if (!correcting) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">{existing.points} pts</span>
        <Button type="button" size="sm" variant="ghost" onClick={() => setCorrecting(true)}>
          Correct
        </Button>
      </div>
    );
  }

  return (
    <CorrectionForm
      activityId={activityId}
      entryId={existing.id}
      defaultValue={existing.points}
      label={label}
      onCancel={() => setCorrecting(false)}
    />
  );
}

function CorrectionForm({
  activityId,
  entryId,
  defaultValue,
  label,
  onCancel,
}: {
  activityId: string;
  entryId: string;
  defaultValue: number;
  label: string;
  onCancel: () => void;
}) {
  const action = correctPointEntry.bind(null, activityId, entryId);
  const [state, formAction, pending] = useActionState(action, idleState);
  const [prevStatus, setPrevStatus] = useState(state.status);

  if (state.status !== prevStatus) {
    setPrevStatus(state.status);
    if (state.status === "success") onCancel();
  }

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Input name="points" type="number" defaultValue={defaultValue} className="w-20" aria-label={label} />
        <Button type="submit" size="sm" disabled={pending}>
          Save
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {state.status === "error" && <span className="text-destructive text-xs">{state.error}</span>}
    </form>
  );
}
