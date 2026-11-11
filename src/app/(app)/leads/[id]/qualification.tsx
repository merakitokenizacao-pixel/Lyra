"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { BANT, TEMPERATURES, TEMPERATURE_ORDER, type BantKey, type LeadTemperature } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { updateQualification } from "../actions";

type State = Record<BantKey, boolean> & { temperature: LeadTemperature };

export function Qualification({ leadId, initial }: { leadId: string; initial: State }) {
  const [state, setState] = useOptimistic(initial, (prev: State, patch: Partial<State>) => ({ ...prev, ...patch }));
  const [, startTransition] = useTransition();
  const score = BANT.filter((b) => state[b.key]).length;

  function update(patch: Partial<State>) {
    startTransition(async () => {
      setState(patch);
      const result = await updateQualification(leadId, patch);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-xs text-ink-3">Critérios BANT</span>
          <span className="text-[13px] font-semibold text-ink tabular-nums">{score}/4</span>
        </div>
        <div className="flex gap-1" aria-hidden>
          {BANT.map((b) => (
            <span key={b.key} className={cn("h-1.5 flex-1 rounded-full", state[b.key] ? "bg-accent" : "bg-line")} />
          ))}
        </div>
      </div>
      <ul className="flex flex-col gap-1">
        {BANT.map((b) => (
          <li key={b.key}>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-subtle">
              <input
                type="checkbox"
                checked={state[b.key]}
                onChange={(e) => update({ [b.key]: e.target.checked } as Partial<State>)}
                className="mt-0.5 size-4 cursor-pointer accent-[var(--accent)]"
              />
              <span>
                <span className="block text-[13px] font-medium text-ink">{b.label}</span>
                <span className="block text-xs text-ink-3">{b.hint}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div>
        <span className="mb-1.5 block text-xs text-ink-3">Temperatura</span>
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-subtle p-0.5">
          {TEMPERATURE_ORDER.map((t) => {
            const meta = TEMPERATURES[t];
            const Icon = meta.icon;
            const active = state.temperature === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                onClick={() => update({ temperature: t })}
                className={cn(
                  "inline-flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-md text-[12.5px]",
                  active ? "bg-panel font-medium text-ink shadow-xs" : "text-ink-3 hover:text-ink",
                )}
              >
                <Icon className={cn("size-3.5", active ? meta.className : "")} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
