"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { STAGE_CATEGORY_LABEL, STAGE_COLORS, type StageCategory, type StageColor } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useAction } from "@/components/ui/use-action";
import { saveStages, type StageInput } from "../actions";

type StageRow = StageInput & { key: string; leads: number };

export function StagesEditor({
  pipelineId,
  stages: initial,
  canEdit,
  onSaved,
}: {
  pipelineId: string;
  stages: (StageInput & { id: string; leads: number })[];
  canEdit: boolean;
  /** Depois de salvar (ex.: fechar o diálogo de etapas do quadro) */
  onSaved?: () => void;
}) {
  const [stages, setStages] = useState<StageRow[]>(initial.map((s) => ({ ...s, key: s.id })));
  const { pending, run } = useAction();
  const dirty = JSON.stringify(stages.map(({ key, leads, ...s }) => s)) !== JSON.stringify(initial.map(({ leads, ...s }) => s));

  const update = (key: string, patch: Partial<StageRow>) =>
    setStages((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const move = (index: number, dir: -1 | 1) =>
    setStages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  return (
    <div className="flex flex-col">
      <ul className="divide-y divide-line">
        {stages.map((stage, index) => (
          <li key={stage.key} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
            <span className="w-5 font-mono text-[11px] text-ink-4">{String(index + 1).padStart(2, "0")}</span>
            <label className="relative" title="Cor da etapa">
              <span className={cn("block size-5 rounded-full ring-2 ring-white", STAGE_COLORS[stage.color as StageColor]?.dot ?? "bg-stone-400")} />
              <select
                value={stage.color}
                disabled={!canEdit}
                onChange={(e) => update(stage.key, { color: e.target.value })}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Cor da etapa"
              >
                {Object.entries(STAGE_COLORS).map(([value, c]) => (
                  <option key={value} value={value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <Input
              value={stage.name}
              disabled={!canEdit}
              onChange={(e) => update(stage.key, { name: e.target.value })}
              className="h-7 min-w-40 flex-1"
              maxLength={60}
              aria-label="Nome da etapa"
            />
            <Select
              value={stage.category}
              disabled={!canEdit}
              onChange={(e) => update(stage.key, { category: e.target.value as StageCategory })}
              className="w-36"
              aria-label="Tipo da etapa"
            >
              {(Object.keys(STAGE_CATEGORY_LABEL) as StageCategory[]).map((c) => (
                <option key={c} value={c}>
                  {STAGE_CATEGORY_LABEL[c]}
                </option>
              ))}
            </Select>
            <span className="w-16 text-right text-xs text-ink-3 tabular-nums">
              {stage.leads} {stage.leads === 1 ? "lead" : "leads"}
            </span>
            {canEdit ? (
              <span className="flex">
                <Button size="icon-sm" variant="ghost" title="Subir" disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowUp />
                </Button>
                <Button size="icon-sm" variant="ghost" title="Descer" disabled={index === stages.length - 1} onClick={() => move(index, 1)}>
                  <ArrowDown />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  title={stage.leads > 0 ? "Mova os leads antes de excluir" : "Excluir etapa"}
                  disabled={stage.leads > 0}
                  onClick={() => setStages((prev) => prev.filter((s) => s.key !== stage.key))}
                >
                  <Trash2 />
                </Button>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {canEdit ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setStages((prev) => {
                const firstClosed = prev.findIndex((s) => s.category !== "open");
                const row: StageRow = { key: `new-${Date.now()}`, name: "Nova etapa", color: "teal", category: "open", leads: 0 };
                if (firstClosed === -1) return [...prev, row];
                return [...prev.slice(0, firstClosed), row, ...prev.slice(firstClosed)];
              })
            }
          >
            <Plus />
            Adicionar etapa
          </Button>
          <div className="flex items-center gap-2">
            {dirty ? (
              <Button size="sm" variant="ghost" onClick={() => setStages(initial.map((s) => ({ ...s, key: s.id })))}>
                <X />
                Descartar
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="primary"
              disabled={!dirty || pending}
              onClick={() =>
                run(() => saveStages(pipelineId, stages.map(({ key, leads, ...s }) => s)), { onSuccess: () => onSaved?.() })
              }
            >
              {pending ? "Salvando…" : "Salvar etapas"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
