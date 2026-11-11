"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, ThumbsDown, Trophy } from "lucide-react";
import { toast } from "sonner";
import type { StageCategory } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { moveLead } from "../actions";

type Stage = { id: string; name: string; category: StageCategory };

export function StageStepper({ leadId, stageId, stages }: { leadId: string; stageId: string; stages: Stage[] }) {
  const [current, setCurrent] = useOptimistic(stageId);
  const [, startTransition] = useTransition();
  const [lostStage, setLostStage] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const open = stages.filter((s) => s.category === "open");
  const won = stages.find((s) => s.category === "won");
  const lost = stages.find((s) => s.category === "lost");
  const currentStage = stages.find((s) => s.id === current);
  const currentIndex = open.findIndex((s) => s.id === current);
  const closedAs = currentStage?.category ?? "open";

  function move(id: string, lostReason?: string) {
    if (id === current) return;
    const target = stages.find((s) => s.id === id);
    startTransition(async () => {
      setCurrent(id);
      const result = await moveLead(leadId, id, target?.category === "lost" ? (lostReason ?? null) : undefined);
      if (!result.ok) toast.error(result.error);
      else toast(`Etapa alterada para ${target?.name}`);
    });
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <ol className="flex min-w-0 flex-1 gap-1">
        {open.map((stage, index) => {
          const done = closedAs === "won" || (closedAs === "open" && index < currentIndex);
          const isCurrent = stage.id === current;
          return (
            <li key={stage.id} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => move(stage.id)}
                title={`Mover para ${stage.name}`}
                className="group flex w-full cursor-pointer flex-col gap-1.5 text-left"
              >
                <span
                  className={cn(
                    "h-1.5 w-full rounded-full transition-colors",
                    isCurrent ? "bg-accent" : done ? "bg-ink/80" : "bg-line group-hover:bg-line-strong",
                  )}
                />
                <span
                  className={cn(
                    "flex items-center gap-1 truncate text-xs",
                    isCurrent ? "font-semibold text-ink" : done ? "text-ink-2" : "text-ink-3 group-hover:text-ink-2",
                  )}
                >
                  {done ? <Check className="size-3 shrink-0" /> : null}
                  <span className="truncate">{stage.name}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="flex shrink-0 gap-2">
        {won ? (
          <Button
            size="sm"
            variant={closedAs === "won" ? "primary" : "secondary"}
            className={cn(closedAs === "won" && "bg-emerald-600 hover:bg-emerald-700")}
            onClick={() => move(won.id)}
          >
            <Trophy />
            {won.name}
          </Button>
        ) : null}
        {lost ? (
          <Button
            size="sm"
            variant={closedAs === "lost" ? "danger-solid" : "secondary"}
            onClick={() => {
              if (closedAs === "lost") return;
              setReason("");
              setLostStage(lost.id);
            }}
          >
            <ThumbsDown />
            {lost.name}
          </Button>
        ) : null}
      </div>
      <Dialog open={Boolean(lostStage)} onOpenChange={(o) => !o && setLostStage(null)}>
        <DialogContent title="Marcar como perdido" description="Registrar o motivo ajuda a entender o funil." size="sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (lostStage) move(lostStage, reason);
              setLostStage(null);
            }}
          >
            <DialogBody>
              <Textarea
                autoFocus
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex.: escolheu um concorrente, sem orçamento neste ano… (opcional)"
                maxLength={500}
              />
            </DialogBody>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setLostStage(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Confirmar perda
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
