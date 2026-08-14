"use client";

import { X } from "lucide-react";

import { assignCoordinator, unassignCoordinator } from "@/lib/actions/activities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Coordinator = { id: string; name: string; email: string };

export function ActivityCoordinatorPicker({
  activityId,
  assigned,
  available,
}: {
  activityId: string;
  assigned: Coordinator[];
  available: Coordinator[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Coordinators</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          {assigned.map((coordinator) => (
            <div key={coordinator.id} className="flex items-center gap-3 border-b py-2 last:border-b-0">
              <span className="flex-1 text-sm">
                {coordinator.name} <span className="text-muted-foreground">({coordinator.email})</span>
              </span>
              <form action={unassignCoordinator.bind(null, activityId, coordinator.id)}>
                <Button type="submit" size="icon" variant="ghost" aria-label={`Unassign ${coordinator.name}`}>
                  <X className="size-4" />
                </Button>
              </form>
            </div>
          ))}
          {assigned.length === 0 && (
            <p className="text-muted-foreground text-sm">No coordinators assigned yet.</p>
          )}
        </div>
        {available.length > 0 ? (
          <form action={assignCoordinator.bind(null, activityId)} className="flex items-center gap-2">
            <Select name="coordinatorId" required>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a coordinator" />
              </SelectTrigger>
              <SelectContent>
                {available.map((coordinator) => (
                  <SelectItem key={coordinator.id} value={coordinator.id}>
                    {coordinator.name} ({coordinator.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">Assign</Button>
          </form>
        ) : (
          <p className="text-muted-foreground text-sm">All coordinators are already assigned.</p>
        )}
      </CardContent>
    </Card>
  );
}
