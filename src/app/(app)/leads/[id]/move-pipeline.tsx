"use client";

import { useId, useState } from "react";
import type { StageCategory } from "@/lib/constants";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";
import { moveLead } from "../actions";

type PipelineOption = { id: string; name: string; stages: { id: string; name: string; category: StageCategory }[] };

/** Leva o lead para outro pipeline, numa etapa em andamento. O histórico vai junto. */
export function MovePipeline({
  leadId,
  currentId,
  pipelines,
}: {
  leadId: string;
  currentId: string;
  pipelines: PipelineOption[];
}) {
  const pipelineFieldId = useId();
  const stageFieldId = useId();
  const others = pipelines.filter((p) => p.id !== currentId);
  const [open, setOpen] = useState(false);
  const [pipelineId, setPipelineId] = useState("");
  const [stageId, setStageId] = useState("");
  const { pending, run } = useAction();

  const target = others.find((p) => p.id === pipelineId) ?? others[0];
  const openStages = target?.stages.filter((s) => s.category === "open") ?? [];
  const stage = openStages.find((s) => s.id === stageId) ?? openStages[0];

  if (!target) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setPipelineId("");
          setStageId("");
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="cursor-pointer rounded font-medium text-accent underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          Mover para outro pipeline
        </button>
      </DialogTrigger>
      <DialogContent
        title="Mover para outro pipeline"
        description="O lead sai deste quadro e entra na etapa escolhida. Atividades e propostas continuam com ele."
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!stage) return;
            run(() => moveLead(leadId, stage.id), {
              success: `Lead movido para “${target.name}”`,
              onSuccess: () => setOpen(false),
            });
          }}
        >
          <DialogBody>
            <Field label="Pipeline" htmlFor={pipelineFieldId}>
              <Select
                id={pipelineFieldId}
                value={target.id}
                onChange={(e) => {
                  setPipelineId(e.target.value);
                  setStageId("");
                }}
              >
                {others.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Etapa"
              htmlFor={stageFieldId}
              error={openStages.length === 0 ? "Esse pipeline não tem etapas em andamento." : null}
            >
              <Select
                id={stageFieldId}
                value={stage?.id ?? ""}
                disabled={openStages.length === 0}
                onChange={(e) => setStageId(e.target.value)}
              >
                {openStages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <SubmitButton pending={pending} disabled={!stage}>
              Mover lead
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
