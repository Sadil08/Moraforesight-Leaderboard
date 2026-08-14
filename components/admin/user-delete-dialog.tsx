import { deleteUser } from "@/lib/actions/users";
import { DeleteDialog } from "@/components/admin/delete-dialog";

export function UserDeleteDialog({ userId, name }: { userId: string; name: string }) {
  return (
    <DeleteDialog
      action={deleteUser.bind(null, userId)}
      title={`Remove ${name}?`}
      description="This permanently deletes their account and unassigns them from any Activities. This can't be undone."
      triggerLabel={`Remove ${name}`}
    />
  );
}
