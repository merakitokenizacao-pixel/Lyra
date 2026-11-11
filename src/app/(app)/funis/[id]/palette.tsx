"use client";

import { Plus } from "lucide-react";
import { STEP_GROUPS, STEP_GROUP_ORDER, STEP_KINDS, STEP_KIND_ORDER, type StepKind } from "@/lib/funnels";
import { cn } from "@/lib/utils";

export const DRAG_TYPE = "application/x-lyro-step";

/** Lista de etapas: arrastar para o quadro, ou clicar (liga na etapa selecionada, quando houver). */
export function Palette({
  onAdd,
  chainFrom,
  className,
}: {
  onAdd: (kind: StepKind) => void;
  /** Nome da etapa selecionada: o clique adiciona a próxima ligada a ela. */
  chainFrom: string | null;
  className?: string;
}) {
  return (
    <aside className={cn("border-line bg-panel lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:border-r", className)} aria-label="Etapas">
      <div className="hidden px-4 pt-3.5 pb-2 lg:block">
        <p className="text-[12.5px] font-semibold text-ink">Etapas</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-ink-3">
          {chainFrom ? (
            <>
              Clique para adicionar depois de <span className="font-medium text-ink-2">{chainFrom}</span>, ou arraste.
            </>
          ) : (
            "Arraste para o quadro ou clique para adicionar."
          )}
        </p>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-3 py-2 lg:block lg:min-h-0 lg:flex-1 lg:overflow-x-visible lg:overflow-y-auto lg:px-2 lg:pt-1 lg:pb-4">
        {STEP_GROUP_ORDER.map((group) => (
          <div key={group} className="flex shrink-0 items-center gap-1 lg:mb-3 lg:block">
            <p className="hidden px-2 pt-1 pb-1 text-[10.5px] font-medium tracking-wide text-ink-4 uppercase lg:block">
              {STEP_GROUPS[group].label}
            </p>
            {STEP_KIND_ORDER.filter((kind) => STEP_KINDS[kind].group === group).map((kind) => {
              const item = STEP_KINDS[kind];
              const Icon = item.icon;
              return (
                <button
                  key={kind}
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(DRAG_TYPE, kind);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => onAdd(kind)}
                  title={item.hint}
                  className="group flex h-8 shrink-0 cursor-grab items-center gap-2 rounded-lg border border-line px-2 text-left text-[12.5px] text-ink-2 transition-colors hover:bg-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent active:cursor-grabbing lg:w-full lg:border-transparent"
                >
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-md [&_svg]:size-3.5", STEP_GROUPS[group].tile)}>
                    <Icon aria-hidden />
                  </span>
                  <span className="truncate">{item.label}</span>
                  <Plus className="ml-auto hidden size-3.5 shrink-0 text-ink-4 lg:group-hover:block" aria-hidden />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
