"use client";

import { Plus, X } from "lucide-react";
import { useActionState } from "react";

import { idleState } from "@/lib/actions/action-state";
import { attachCriterion, detachCriterion, updateCriterionPointValue } from "@/lib/actions/activities";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Attached = { criterionId: string; name: string; pointValue: number };
type Available = { id: string; name: string };

function CriterionRow({ activityId, criterion }: { activityId: string; criterion: Attached }) {
  const action = updateCriterionPointValue.bind(null, activityId, criterion.criterionId);
  const [state, formAction, pending] = useActionState(action, idleState);

  return (
    <div className="flex items-center gap-3 border-b py-2 last:border-b-0">
      <span className="flex-1 text-sm">{criterion.name}</span>
      <form action={formAction} className="flex items-center gap-2">
        <Input
          name="pointValue"
          type="number"
          defaultValue={criterion.pointValue}
          className="w-20"
          aria-label={`Point value for ${criterion.name}`}
        />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          Save
        </Button>
        {state.status === "error" && <span className="text-destructive text-xs">{state.error}</span>}
      </form>
      <form action={detachCriterion.bind(null, activityId, criterion.criterionId)}>
        <Button type="submit" size="icon" variant="ghost" aria-label={`Detach ${criterion.name}`}>
          <X className="size-4" />
        </Button>
      </form>
    </div>
  );
}

function AttachCriterionForm({ activityId, available }: { activityId: string; available: Available[] }) {
  const action = attachCriterion.bind(null, activityId);
  const [state, formAction, pending] = useActionState(action, idleState);

  if (available.length === 0) {
    return <p className="text-muted-foreground text-sm">All criteria are already attached.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Select name="criterionId" required>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a criterion" />
          </SelectTrigger>
          <SelectContent>
            {available.map((criterion) => (
              <SelectItem key={criterion.id} value={criterion.id}>
                {criterion.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input name="pointValue" type="number" placeholder="Points" defaultValue={0} className="w-24" required />
        <Button type="submit" disabled={pending}>
          <Plus className="size-4" />
          Attach
        </Button>
      </div>
      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}

export function ActivityCriteriaPicker({
  activityId,
  attached,
  available,
}: {
  activityId: string;
  attached: Attached[];
  available: Available[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Criteria & Point Values</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          {attached.map((criterion) => (
            <CriterionRow key={criterion.criterionId} activityId={activityId} criterion={criterion} />
          ))}
          {attached.length === 0 && (
            <p className="text-muted-foreground text-sm">No criteria attached yet.</p>
          )}
        </div>
        <AttachCriterionForm activityId={activityId} available={available} />
      </CardContent>
    </Card>
  );
}
