export type ActionState = { status: "idle" } | { status: "error"; error: string } | { status: "success" };

export const idleState: ActionState = { status: "idle" };
