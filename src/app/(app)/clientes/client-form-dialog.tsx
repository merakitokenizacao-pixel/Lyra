"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CLIENT_STATUSES, CLIENT_STATUS_ORDER, type ClientStatus } from "@/lib/constants";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";
import { createCustomer, updateCustomer } from "./actions";

export type ClientFormValues = {
  id: string;
  name: string;
  legal_name: string | null;
  kind: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  monthly_value: number;
  customer_since: string | null;
  notes: string | null;
  tags: string[];
  owner_id: string | null;
  status: ClientStatus;
};

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

export function ClientFormDialog({
  trigger,
  client,
  members,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: ReactNode;
  client?: ClientFormValues;
  members: { id: string; name: string; you?: boolean }[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [kind, setKind] = useState(client?.kind ?? "company");
  const router = useRouter();
  const { pending, submit } = useAction();
  const editing = Boolean(client);

  const onSubmit = submit((fd) => (client ? updateCustomer(client.id, fd) : createCustomer(fd)), {
    silent: true,
    onSuccess: (result) => {
      setOpen(false);
      if (!client && result?.id) {
        toast.success("Cliente cadastrado");
        router.push(`/clientes/${result.id}`);
      } else {
        toast.success("Cliente atualizado");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent title={editing ? "Editar cliente" : "Novo cliente"} size="lg">
        <form onSubmit={onSubmit}>
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo" className="sm:col-span-2">
              <div className="inline-flex w-fit rounded-lg border border-line bg-subtle p-0.5">
                {[
                  { value: "company", label: "Empresa" },
                  { value: "person", label: "Pessoa física" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`inline-flex h-7 cursor-pointer items-center rounded-md px-3 text-[12.5px] ${
                      kind === opt.value ? "bg-panel font-medium text-ink shadow-xs" : "text-ink-3"
                    }`}
                  >
                    <input
                      type="radio"
                      name="kind"
                      value={opt.value}
                      checked={kind === opt.value}
                      onChange={() => setKind(opt.value)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </Field>
            <Field label={kind === "company" ? "Nome fantasia *" : "Nome completo *"} htmlFor="c-name">
              <Input id="c-name" name="name" required defaultValue={client?.name} autoFocus />
            </Field>
            {kind === "company" ? (
              <Field label="Razão social" htmlFor="c-legal">
                <Input id="c-legal" name="legal_name" defaultValue={client?.legal_name ?? ""} />
              </Field>
            ) : (
              <input type="hidden" name="legal_name" value="" />
            )}
            <Field label={kind === "company" ? "CNPJ" : "CPF"} htmlFor="c-doc">
              <Input
                id="c-doc"
                name="document"
                defaultValue={client?.document ?? ""}
                placeholder={kind === "company" ? "00.000.000/0001-00" : "000.000.000-00"}
              />
            </Field>
            <Field label="Segmento" htmlFor="c-industry">
              <Input id="c-industry" name="industry" defaultValue={client?.industry ?? ""} placeholder="Ex.: Varejo, Saúde, SaaS" />
            </Field>
            <Field label="E-mail" htmlFor="c-email">
              <Input id="c-email" name="email" type="email" defaultValue={client?.email ?? ""} />
            </Field>
            <Field label="Telefone" htmlFor="c-phone">
              <Input id="c-phone" name="phone" defaultValue={client?.phone ?? ""} />
            </Field>
            <Field label="Site" htmlFor="c-site">
              <Input id="c-site" name="website" defaultValue={client?.website ?? ""} placeholder="empresa.com.br" />
            </Field>
            <div className="grid grid-cols-[1fr_88px] gap-3">
              <Field label="Cidade" htmlFor="c-city">
                <Input id="c-city" name="city" defaultValue={client?.city ?? ""} />
              </Field>
              <Field label="UF" htmlFor="c-state">
                <Select id="c-state" name="state" defaultValue={client?.state ?? ""}>
                  <option value="">—</option>
                  {UFS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {!editing ? (
              <Field label="Status inicial" htmlFor="c-status">
                <Select id="c-status" name="status" defaultValue="onboarding">
                  {CLIENT_STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {CLIENT_STATUSES[s].label}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Field label="Receita mensal (R$)" htmlFor="c-mrr" hint="Valor recorrente do contrato.">
              <Input
                id="c-mrr"
                name="monthly_value"
                inputMode="decimal"
                placeholder="0,00"
                defaultValue={client?.monthly_value ? String(client.monthly_value).replace(".", ",") : ""}
              />
            </Field>
            <Field label="Cliente desde" htmlFor="c-since">
              <Input id="c-since" name="customer_since" type="date" defaultValue={client?.customer_since ?? ""} />
            </Field>
            <Field label="Responsável" htmlFor="c-owner">
              <Select
                id="c-owner"
                name="owner_id"
                defaultValue={editing ? (client?.owner_id ?? "") : (members.find((m) => m.you)?.id ?? "")}
              >
                {editing ? <option value="">Sem responsável</option> : null}
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tags" htmlFor="c-tags" hint="Separe por vírgula." className="sm:col-span-2">
              <Input id="c-tags" name="tags" defaultValue={client?.tags.join(", ")} />
            </Field>
            <Field label="Observações" htmlFor="c-notes" className="sm:col-span-2">
              <Textarea id="c-notes" name="notes" defaultValue={client?.notes ?? ""} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <SubmitButton pending={pending}>{editing ? "Salvar alterações" : "Cadastrar cliente"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
