"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";
import { createProposalFromForm } from "./actions";

export function NewProposalDialog({
  clients,
  leads,
}: {
  clients: { id: string; name: string }[];
  leads: { id: string; name: string; company: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const { pending, submit } = useAction();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus />
          Nova proposta
        </Button>
      </DialogTrigger>
      <DialogContent title="Nova proposta" description="Escolha para quem é a proposta. Você monta o conteúdo no editor em seguida.">
        <form onSubmit={submit(createProposalFromForm)}>
          <DialogBody>
            <Field label="Destinatário" htmlFor="np-recipient">
              <Select id="np-recipient" name="recipient" defaultValue={clients[0] ? `client:${clients[0].id}` : leads[0] ? `lead:${leads[0].id}` : ""}>
                <option value="">Sem destinatário por enquanto</option>
                {clients.length > 0 ? (
                  <optgroup label="Clientes">
                    {clients.map((c) => (
                      <option key={c.id} value={`client:${c.id}`}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
                {leads.length > 0 ? (
                  <optgroup label="Leads em aberto">
                    {leads.map((l) => (
                      <option key={l.id} value={`lead:${l.id}`}>
                        {l.company ? `${l.company} · ${l.name}` : l.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </Select>
            </Field>
            <Field label="Título" htmlFor="np-title" hint="Opcional — por padrão usamos o nome do destinatário.">
              <Input id="np-title" name="title" placeholder="Ex.: Implantação do processo comercial" maxLength={200} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <SubmitButton pending={pending}>Criar e abrir editor</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
