"use client";

import { useState, type ReactNode } from "react";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";
import type { BillingCycle } from "@/lib/constants";
import { createProduct, updateProduct } from "./actions";

export type ProductValues = {
  id: string;
  name: string;
  description: string | null;
  unit_price: number;
  unit: string;
  billing: BillingCycle;
  active: boolean;
};

const UNITS = ["un", "projeto", "mês", "hora", "turma", "licença", "usuário", "sessão"];

export function ProductDialog({ trigger, product }: { trigger: ReactNode; product?: ProductValues }) {
  const [open, setOpen] = useState(false);
  const { pending, submit } = useAction();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={product ? "Editar produto" : "Novo produto ou serviço"} description="Itens do catálogo entram nas propostas com um clique.">
        <form
          onSubmit={submit((fd) => (product ? updateProduct(product.id, fd) : createProduct(fd)), {
            onSuccess: () => setOpen(false),
          })}
        >
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome *" htmlFor="pr-name" className="sm:col-span-2">
              <Input id="pr-name" name="name" required defaultValue={product?.name} autoFocus placeholder="Ex.: Consultoria de implantação" />
            </Field>
            <Field label="Descrição" htmlFor="pr-desc" className="sm:col-span-2">
              <Textarea id="pr-desc" name="description" rows={2} defaultValue={product?.description ?? ""} placeholder="Aparece abaixo do item na proposta." />
            </Field>
            <Field label="Preço (R$)" htmlFor="pr-price">
              <Input
                id="pr-price"
                name="unit_price"
                inputMode="decimal"
                placeholder="0,00"
                defaultValue={product ? String(product.unit_price).replace(".", ",") : ""}
              />
            </Field>
            <Field label="Unidade" htmlFor="pr-unit">
              <Input id="pr-unit" name="unit" list="pr-units" defaultValue={product?.unit ?? "un"} maxLength={20} />
              <datalist id="pr-units">
                {UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </Field>
            <Field label="Cobrança" htmlFor="pr-billing">
              <Select id="pr-billing" name="billing" defaultValue={product?.billing ?? "one_time"}>
                <option value="one_time">Pagamento único</option>
                <option value="monthly">Mensal (recorrente)</option>
              </Select>
            </Field>
            <Field label="Disponível em propostas" htmlFor="pr-active">
              <Select id="pr-active" name="active" defaultValue={product?.active === false ? "off" : "on"}>
                <option value="on">Sim, ativo</option>
                <option value="off">Não, inativo</option>
              </Select>
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <SubmitButton pending={pending}>{product ? "Salvar" : "Cadastrar"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
