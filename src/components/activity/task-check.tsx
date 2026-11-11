"use client";

import { useOptimistic, useTransition } from "react";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { deleteActivity, toggleTask } from "@/app/(app)/activity-actions";

export function TaskCheck({ id, done }: { id: string; done: boolean }) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(done);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={optimisticDone}
      aria-label={optimisticDone ? "Reabrir tarefa" : "Concluir tarefa"}
      onClick={() =>
        startTransition(async () => {
          setOptimisticDone(!optimisticDone);
          const result = await toggleTask(id, !optimisticDone);
          if (!result.ok) toast.error(result.error);
          else if (!optimisticDone) toast.success("Tarefa concluída");
        })
      }
      className={cn(
        "mt-px grid size-4 shrink-0 cursor-pointer place-items-center rounded border transition-colors",
        optimisticDone ? "border-ink bg-ink text-white" : "border-line-strong bg-panel hover:border-ink-3",
      )}
    >
      {optimisticDone ? <Check className="size-3" strokeWidth={3} /> : null}
    </button>
  );
}

export function ActivityActions({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      title="Remover atividade"
      onClick={() =>
        startTransition(async () => {
          const result = await deleteActivity(id);
          if (!result.ok) toast.error(result.error);
        })
      }
      className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-md text-ink-4 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-hover hover:text-danger focus-visible:opacity-100"
    >
      <Trash2 className="size-3.5" />
      <span className="sr-only">Remover</span>
    </button>
  );
}
