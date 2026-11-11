"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, FilePlus2, Pencil, Trash2, UserRoundCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";
import { createProposal } from "../../propostas/actions";
import { convertLead, deleteLead } from "../actions";
import { LeadFormDialog, type LeadFormValues } from "../lead-form-dialog";

export function LeadHeaderActions({
  lead,
  members,
  convertedClientId,
}: {
  lead: LeadFormValues;
  members: { id: string; name: string; you?: boolean }[];
  convertedClientId: string | null;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const proposal = useAction();

  return (
    <>
      {convertedClientId ? (
        <Button asChild variant="secondary" className="hidden sm:inline-flex">
          <Link href={`/clientes/${convertedClientId}`}>
            Ver cliente
            <ArrowUpRight />
          </Link>
        </Button>
      ) : (
        <ConfirmDialog
          title="Converter em cliente?"
          description="Criamos o cliente com os dados deste lead (status Onboarding), movemos o lead para Ganho e vinculamos as propostas."
          confirmLabel="Converter"
          tone="primary"
          action={() => convertLead(lead.id)}
          success="Cliente criado"
          onDone={(result) => {
            if (result?.id) router.push(`/clientes/${result.id}`);
          }}
          trigger={
            <Button variant="secondary" className="hidden sm:inline-flex">
              <UserRoundCheck />
              Converter em cliente
            </Button>
          }
        />
      )}
      <Button
        variant="primary"
        disabled={proposal.pending}
        onClick={() => proposal.run(() => createProposal({ leadId: lead.id }))}
      >
        <FilePlus2 />
        <span className="hidden sm:inline">Nova proposta</span>
      </Button>
      <Button variant="secondary" size="icon" title="Editar lead" onClick={() => setEditOpen(true)}>
        <Pencil />
        <span className="sr-only">Editar</span>
      </Button>
      <ConfirmDialog
        title="Excluir lead?"
        description="O lead e toda a linha do tempo dele serão removidos. Propostas vinculadas continuam existindo. Essa ação não pode ser desfeita."
        action={() => deleteLead(lead.id)}
        trigger={
          <Button variant="secondary" size="icon" title="Excluir lead">
            <Trash2 />
            <span className="sr-only">Excluir</span>
          </Button>
        }
      />
      <LeadFormDialog open={editOpen} onOpenChange={setEditOpen} lead={lead} members={members} />
    </>
  );
}
