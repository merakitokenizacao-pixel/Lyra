"use client";

import { useState } from "react";
import { FilePlus2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";
import { createProposal } from "../../propostas/actions";
import { deleteCustomer } from "../actions";
import { ClientFormDialog, type ClientFormValues } from "../client-form-dialog";

export function ClientHeaderActions({
  client,
  members,
}: {
  client: ClientFormValues;
  members: { id: string; name: string; you?: boolean }[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const proposal = useAction();

  return (
    <>
      <Button
        variant="primary"
        disabled={proposal.pending}
        onClick={() => proposal.run(() => createProposal({ clientId: client.id }))}
      >
        <FilePlus2 />
        <span className="hidden sm:inline">Nova proposta</span>
      </Button>
      <Button variant="secondary" size="icon" title="Editar cliente" onClick={() => setEditOpen(true)}>
        <Pencil />
        <span className="sr-only">Editar</span>
      </Button>
      <ConfirmDialog
        title="Excluir cliente?"
        description="O cliente, seus contatos e a linha do tempo serão removidos. Propostas ficam sem destinatário. Essa ação não pode ser desfeita."
        action={() => deleteCustomer(client.id)}
        trigger={
          <Button variant="secondary" size="icon" title="Excluir cliente">
            <Trash2 />
            <span className="sr-only">Excluir</span>
          </Button>
        }
      />
      <ClientFormDialog open={editOpen} onOpenChange={setEditOpen} client={client} members={members} />
    </>
  );
}
