import { CriterionDialog } from "@/components/admin/criterion-dialog";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { deleteCriterion } from "@/lib/actions/criteria";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

export default async function AdminCriteriaPage() {
  const criteria = await prisma.criterion.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Criteria</h1>
        <CriterionDialog />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {criteria.map((criterion) => (
            <TableRow key={criterion.id}>
              <TableCell className="font-medium">{criterion.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {criterion.description || "—"}
              </TableCell>
              <TableCell>
                <Badge variant={criterion.visible ? "default" : "secondary"}>
                  {criterion.visible ? "Visible" : "Hidden"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <CriterionDialog criterion={criterion} />
                  <DeleteDialog
                    action={deleteCriterion.bind(null, criterion.id)}
                    title={`Remove ${criterion.name}?`}
                    description="This permanently deletes the criterion and detaches it from any Activities. This can't be undone."
                    triggerLabel={`Remove ${criterion.name}`}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {criteria.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground text-center">
                No criteria yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
