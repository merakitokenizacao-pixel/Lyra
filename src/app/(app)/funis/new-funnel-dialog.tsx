"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { FUNNEL_TEMPLATES, templateByKey } from "@/lib/funnels";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";
import { createFunnel } from "./actions";
import { TemplateChain } from "./template-chain";

type Product = { id: string; name: string; price: number };

export function NewFunnelDialog({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState(FUNNEL_TEMPLATES[0].key);
  const { pending, submit } = useAction();
  const chosen = templateByKey(template);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus />
          Novo funil
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Novo funil"
        description="Escolha um ponto de partida. Etapas, taxas e valores você ajusta no quadro."
        size="lg"
      >
        <form onSubmit={submit(createFunnel)}>
          <DialogBody>
            <fieldset>
              <legend className="mb-1.5 text-[12.5px] font-medium text-ink-2">Modelo</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {FUNNEL_TEMPLATES.map((t) => {
                  const selected = t.key === template;
                  return (
                    <label
                      key={t.key}
                      className={cn(
                        "relative flex cursor-pointer flex-col gap-2 rounded-lg border p-3 transition-colors",
                        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                        selected ? "border-accent bg-accent-soft/50" : "border-line hover:border-line-strong hover:bg-subtle",
                      )}
                    >
                      <input
                        type="radio"
                        name="template"
                        value={t.key}
                        checked={selected}
                        onChange={() => setTemplate(t.key)}
                        className="sr-only"
                      />
                      <span className="flex items-center justify-between gap-2">
                        <TemplateChain kinds={t.preview} />
                        {selected ? (
                          <span className="grid size-4.5 shrink-0 place-items-center rounded-full bg-accent text-white">
                            <Check className="size-3" aria-hidden />
                          </span>
                        ) : null}
                      </span>
                      <span className="text-[13px] font-medium text-ink">{t.name}</span>
                      <span className="text-[12px] leading-snug text-ink-3">{t.description}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <Field label="Nome" htmlFor="nf-name" hint="Opcional. Sem nome, usamos o do modelo.">
              <Input
                id="nf-name"
                name="name"
                maxLength={120}
                placeholder={chosen.key === "blank" ? "Novo funil" : chosen.name}
                autoComplete="off"
              />
            </Field>
            {products.length > 0 ? (
              <Field label="Produto" htmlFor="nf-product" hint="O preço do produto vira o valor de cada venda no modelo.">
                <Select id="nf-product" name="product_id" defaultValue="">
                  <option value="">Nenhum por enquanto</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.price > 0 ? `${p.name} · ${formatMoney(p.price)}` : p.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <SubmitButton pending={pending}>Criar e abrir o quadro</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
