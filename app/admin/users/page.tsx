import { UserCreateDialog } from "@/components/admin/user-create-dialog";
import { UserDeleteDialog } from "@/components/admin/user-delete-dialog";
import { UserEditDialog } from "@/components/admin/user-edit-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth-guards";
import { setUserActive } from "@/lib/actions/users";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <UserCreateDialog />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-48" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{user.role}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.active ? "default" : "secondary"}>
                  {user.active ? "Active" : "Disabled"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <UserEditDialog user={user} />
                  {user.id !== session.user.id && (
                    <>
                      <form action={setUserActive.bind(null, user.id, !user.active)}>
                        <Button type="submit" variant="outline" size="sm">
                          {user.active ? "Disable" : "Enable"}
                        </Button>
                      </form>
                      <UserDeleteDialog userId={user.id} name={user.name} />
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
