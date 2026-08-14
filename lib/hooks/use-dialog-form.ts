"use client";

import { useState } from "react";

import type { ActionState } from "@/lib/actions/action-state";

// Closes a controlled Dialog once its Server Action reports success, without a
// useEffect (would cause a cascading extra render) — this is React's documented
// "adjust state during render" pattern for deriving state from a prop change.
export function useDialogOpenOnActionSuccess(state: ActionState) {
  const [open, setOpen] = useState(false);
  const [prevStatus, setPrevStatus] = useState(state.status);

  if (state.status !== prevStatus) {
    setPrevStatus(state.status);
    if (state.status === "success") setOpen(false);
  }

  return [open, setOpen] as const;
}
