"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { DEFAULT_PIPELINE_STAGES, stageColor, type StageCategory } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";
import { createPipeline } from "../configuracoes/actions";

type StagePreview = { name: string; color: string; category: StageCategory };
export type PipelineTemplate = { id: string; name: string; stages: StagePreview[] };

/** "Novo pipeline": nome e de onde vêm as etapas (modelo padrão ou cópia de um pipeline existente). */
export function NewPipelineDialog({ pipelines, className }: { pipelines: PipelineTemplate[]; className?: string }) {
  const router = useRouter();
  const nameId = useId();
  const templateId = useId();
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState("standard");
  const { pending, submit } = useAction();
  const stages = pipelines.find((p) => p.id === template)?.stages ?? DEFAULT_PIPELINE_STAGES;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTemplate("standard");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" aria-label="Novo pipeline" className={cn("w-7 px-0 lg:w-full lg:px-2.5", className)}>
          <Plus />
          <span className="hidden lg:inline">Novo pipeline</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Novo pipeline"
        description="Um quadro separado, com etapas próprias. Bom para campanhas, produtos ou times diferentes."
      >
        <form
          onSubmit={submit(createPipeline, {
            onSuccess: (result) => {
              setOpen(false);
              setTemplate("standard");
              if (result?.id) router.push(`/pipeline?pipeline=${result.id}`);
            },
          })}
        >
          <DialogBody>
            <Field label="Nome" htmlFor={nameId}>
              <Input
                id={nameId}
                name="name"
                required
                maxLength={80}
                autoFocus
                autoComplete="off"
                placeholder="Ex.: Black Friday, Parcerias, Renovações"
              />
            </Field>
            <Field label="Etapas" htmlFor={templateId} hint="Depois você pode renomear, reordenar e trocar as etapas.">
              <Select id={templateId} name="template" value={template} onChange={(e) => setTemplate(e.target.value)}>
                <option value="standard">Modelo padrão de vendas</option>
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    Copiar de “{p.name}”
                  </option>
                ))}
              </Select>
            </Field>
            <ol className="flex flex-wrap gap-1.5" aria-label="Etapas que o pipeline vai ter">
              {stages.map((stage, index) => (
                <li
                  key={`${index}-${stage.name}`}
                  className="inline-flex h-6 items-center gap-1.5 rounded-md border border-line bg-subtle px-2 text-[12px] text-ink-2"
                >
                  <span aria-hidden className={cn("size-2 shrink-0 rounded-full", stageColor(stage.color).dot)} />
                  {stage.name}
                </li>
              ))}
            </ol>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <SubmitButton pending={pending}>Criar pipeline</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
