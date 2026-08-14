"use client";

import { Trash2 } from "lucide-react";
import { useActionState } from "react";

import type { ActionState } from "@/lib/actions/action-state";
import { idleState } from "@/lib/actions/action-state";
import { useDialogOpenOnActionSuccess } from "@/lib/hooks/use-dialog-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;

export function DeleteDialog({
  action,
  title,
  description,
  triggerLabel,
}: {
  action: DeleteAction;
  title: string;
  description: string;
  triggerLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, idleState);
  const [open, setOpen] = useDialogOpenOnActionSuccess(state);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={triggerLabel}>
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
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
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
