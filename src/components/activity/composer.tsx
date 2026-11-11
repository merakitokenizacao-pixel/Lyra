"use client";

import { useState } from "react";
import { ACTIVITY_TYPES, COMPOSER_TYPES, type ActivityType } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";
import { createActivity } from "@/app/(app)/activity-actions";

const PLACEHOLDER: Partial<Record<ActivityType, string>> = {
  note: "Escreva uma nota sobre este contato…",
  call: "Como foi a ligação? Próximos passos…",
  email: "Resumo do e-mail enviado ou recebido…",
  meeting: "Pauta, participantes e decisões da reunião…",
  whatsapp: "Resumo da conversa no WhatsApp…",
};

export function ActivityComposer({ leadId, clientId }: { leadId?: string | null; clientId?: string | null }) {
  const [type, setType] = useState<ActivityType>("note");
  const { pending, submit } = useAction();
  const isTask = type === "task";

  return (
    <form
      onSubmit={(event) => {
        const form = event.currentTarget;
        submit((fd) => createActivity({ leadId, clientId }, fd), { onSuccess: () => form.reset() })(event);
      }}
      className="rounded-xl border border-line bg-panel shadow-xs focus-within:border-line-strong"
    >
      <input type="hidden" name="type" value={type} />
      <div className="flex gap-1 overflow-x-auto border-b border-line px-2 py-1.5">
        {COMPOSER_TYPES.map((t) => {
          const Icon = ACTIVITY_TYPES[t].icon;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[12.5px] transition-colors",
                t === type ? "bg-ink text-white" : "text-ink-3 hover:bg-hover hover:text-ink",
              )}
            >
              <Icon className="size-3.5" />
              {ACTIVITY_TYPES[t].label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 p-3">
        {isTask ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input name="title" placeholder="O que precisa ser feito?" className="flex-1" maxLength={200} />
            <Input name="due_at" type="datetime-local" className="sm:w-52" aria-label="Prazo" />
          </div>
        ) : (
          <Textarea
            name="body"
            placeholder={PLACEHOLDER[type]}
            className="min-h-16 border-0 px-0 py-0 shadow-none hover:border-0 focus:ring-0"
            maxLength={5000}
          />
        )}
        <div className="flex justify-end">
          <SubmitButton pending={pending} size="sm">
            {isTask ? "Criar tarefa" : "Registrar"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
