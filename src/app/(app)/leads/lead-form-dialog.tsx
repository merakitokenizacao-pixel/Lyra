"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LEAD_SOURCES, TEMPERATURES, TEMPERATURE_ORDER, type LeadTemperature } from "@/lib/constants";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";
import { createLead, updateLead } from "./actions";

export type LeadFormValues = {
  id: string;
  name: string;
  company: string | null;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  estimated_value: number;
  temperature: LeadTemperature;
  expected_close_date: string | null;
  notes: string | null;
  tags: string[];
  owner_id: string | null;
};

type StageGroup = { pipeline: string; stages: { id: string; name: string }[] };

export function LeadFormDialog({
  trigger,
  stageGroups,
  members,
  lead,
  defaultStageId,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: ReactNode;
  stageGroups?: StageGroup[];
  members: { id: string; name: string; you?: boolean }[];
  lead?: LeadFormValues;
  defaultStageId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const { pending, submit } = useAction();
  const editing = Boolean(lead);

  const onSubmit = submit((fd) => (lead ? updateLead(lead.id, fd) : createLead(fd)), {
    silent: true,
    onSuccess: (result) => {
      setOpen(false);
      if (!lead && result?.id) {
        const id = result.id;
        toast.success("Lead criado", { action: { label: "Abrir", onClick: () => router.push(`/leads/${id}`) } });
      } else {
        toast.success("Lead atualizado");
      }
    },
  });

  const firstStage = defaultStageId ?? stageGroups?.[0]?.stages[0]?.id;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        title={editing ? "Editar lead" : "Novo lead"}
        description={editing ? undefined : "Cadastre a oportunidade e escolha em que etapa ela entra no pipeline."}
        size="lg"
      >
        <form onSubmit={onSubmit}>
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do contato *" htmlFor="lead-name" className="sm:col-span-2">
              <Input id="lead-name" name="name" required defaultValue={lead?.name} placeholder="Ex.: Mariana Costa" autoFocus />
            </Field>
            <Field label="Empresa" htmlFor="lead-company">
              <Input id="lead-company" name="company" defaultValue={lead?.company ?? ""} placeholder="Ex.: Costa Alimentos" />
            </Field>
            <Field label="Cargo" htmlFor="lead-job">
              <Input id="lead-job" name="job_title" defaultValue={lead?.job_title ?? ""} placeholder="Ex.: Diretora comercial" />
            </Field>
            <Field label="E-mail" htmlFor="lead-email">
              <Input id="lead-email" name="email" type="email" defaultValue={lead?.email ?? ""} placeholder="nome@empresa.com.br" />
            </Field>
            <Field label="Telefone / WhatsApp" htmlFor="lead-phone">
              <Input id="lead-phone" name="phone" defaultValue={lead?.phone ?? ""} placeholder="(11) 90000-0000" />
            </Field>
            {!editing && stageGroups ? (
              <Field label="Etapa" htmlFor="lead-stage">
                <Select id="lead-stage" name="stage_id" defaultValue={firstStage}>
                  {stageGroups.map((group) =>
                    stageGroups.length > 1 ? (
                      <optgroup key={group.pipeline} label={group.pipeline}>
                        {group.stages.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </optgroup>
                    ) : (
                      group.stages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))
                    ),
                  )}
                </Select>
              </Field>
            ) : null}
            <Field label="Origem" htmlFor="lead-source">
              <Select id="lead-source" name="source" defaultValue={lead?.source ?? ""}>
                <option value="">Não informada</option>
                {Object.entries(LEAD_SOURCES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Valor estimado (R$)" htmlFor="lead-value">
              <Input
                id="lead-value"
                name="estimated_value"
                inputMode="decimal"
                defaultValue={lead?.estimated_value ? String(lead.estimated_value).replace(".", ",") : ""}
                placeholder="0,00"
              />
            </Field>
            <Field label="Temperatura" htmlFor="lead-temp">
              <Select id="lead-temp" name="temperature" defaultValue={lead?.temperature ?? "warm"}>
                {TEMPERATURE_ORDER.map((t) => (
                  <option key={t} value={t}>
                    {TEMPERATURES[t].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Previsão de fechamento" htmlFor="lead-close">
              <Input id="lead-close" name="expected_close_date" type="date" defaultValue={lead?.expected_close_date ?? ""} />
            </Field>
            <Field label="Responsável" htmlFor="lead-owner">
              <Select
                id="lead-owner"
                name="owner_id"
                defaultValue={editing ? (lead?.owner_id ?? "") : (members.find((m) => m.you)?.id ?? "")}
              >
                {editing ? <option value="">Sem responsável</option> : null}
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tags" htmlFor="lead-tags" hint="Separe por vírgula." className="sm:col-span-2">
              <Input id="lead-tags" name="tags" defaultValue={lead?.tags.join(", ")} placeholder="varejo, indicação vip" />
            </Field>
            <Field label="Observações" htmlFor="lead-notes" className="sm:col-span-2">
              <Textarea id="lead-notes" name="notes" defaultValue={lead?.notes ?? ""} placeholder="Contexto, dores, concorrentes…" />
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <SubmitButton pending={pending}>{editing ? "Salvar alterações" : "Criar lead"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
