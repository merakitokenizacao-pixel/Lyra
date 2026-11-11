import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOwnerOptions } from "@/lib/queries";
import { ClientFormDialog } from "./client-form-dialog";

export async function NewClientButton() {
  const members = await getOwnerOptions();
  return (
    <ClientFormDialog
      members={members}
      trigger={
        <Button variant="primary">
          <Plus />
          Novo cliente
        </Button>
      }
    />
  );
}

export function NewClientButtonFallback() {
  return (
    <Button variant="primary" disabled>
      <Plus />
      Novo cliente
    </Button>
  );
}
