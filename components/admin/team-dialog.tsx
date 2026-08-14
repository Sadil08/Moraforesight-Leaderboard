"use client";

import { Pencil, Plus } from "lucide-react";
import { useActionState } from "react";

import { idleState } from "@/lib/actions/action-state";
import { createTeam, updateTeam } from "@/lib/actions/teams";
import { useDialogOpenOnActionSuccess } from "@/lib/hooks/use-dialog-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Team = { id: string; name: string; color: string | null };

export function TeamDialog({ team }: { team?: Team }) {
  const action = team ? updateTeam.bind(null, team.id) : createTeam;
  const [state, formAction, pending] = useActionState(action, idleState);
  const [open, setOpen] = useDialogOpenOnActionSuccess(state);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {team ? (
          <Button variant="ghost" size="icon" aria-label="Edit team">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            New Team
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{team ? "Edit Team" : "New Team"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={team?.name} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="color">Color (optional)</Label>
            <Input id="color" name="color" defaultValue={team?.color ?? ""} placeholder="#3b82f6" />
          </div>
          {state.status === "error" && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
